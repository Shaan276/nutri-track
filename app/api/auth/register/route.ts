import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";

/**
 * Registration API Route
 * POST /api/auth/register
 *
 * Validates user input, checks uniqueness, hashes password, and persists user in PostgreSQL.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate incoming data
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, username, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // 2. Check for duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // 3. Check for duplicate username
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another" },
        { status: 409 }
      );
    }

    // 4. Check for pre-approval allowlist or global auto-approve setting
    const preApproved = await (prisma as any).preApprovedUser.findFirst({
      where: {
        identifier: normalizedEmail,
        consumedAt: null,
      },
    });

    const isPreApproved = Boolean(preApproved);
    const { SystemSettingsService } = await import("@/lib/services/admin/system-settings.service");
    const autoApprove = (await SystemSettingsService.getSetting("REGISTRATION_AUTO_APPROVE")) === "true";

    const isApproved = isPreApproved || autoApprove;
    const accountStatus = isApproved ? "APPROVED" : "PENDING_APPROVAL";
    const approvedAt = isApproved ? new Date() : null;
    const approvedByAdminId = preApproved?.createdByAdminId || null;

    // 5. Hash password with bcrypt (12 salt rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // 6. Create user in PostgreSQL
    const newUser = await (prisma as any).user.create({
      data: {
        name: name.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        role: "USER",
        accountStatus,
        approvedAt,
        approvedByAdminId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        accountStatus: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    // 7. If pre-approved, mark allowlist entry as consumed
    if (preApproved) {
      await (prisma as any).preApprovedUser.update({
        where: { id: preApproved.id },
        data: {
          consumedAt: new Date(),
          consumedByUserId: newUser.id,
        },
      });
    } else {
      // Notify Admin(s) about pending user approval
      try {
        const { NotificationService } = await import("@/lib/services/notification.service");
        const admins = await (prisma as any).user.findMany({ where: { role: "ADMIN" } });
        for (const admin of admins || []) {
          await NotificationService.createNotification({
            userId: admin.id,
            actorId: newUser.id,
            category: "ADMIN",
            type: "USER_PENDING_APPROVAL",
            title: "New User Awaiting Approval",
            message: `${newUser.name} (@${newUser.username}) registered and is awaiting approval.`,
            actionUrl: `/admin/users/${newUser.id}`,
          });
        }
      } catch (err) {
        console.error("Failed to notify admin on user registration:", err);
      }
    }

    // 8. Return sanitized user data
    return NextResponse.json(
      {
        status: "success",
        message: isPreApproved
          ? "Account created and pre-approved! You can sign in immediately."
          : "Account created successfully. Your account is awaiting admin approval.",
        user: newUser,
        requiresApproval: !isPreApproved,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating your account. Please try again." },
      { status: 500 }
    );
  }
}

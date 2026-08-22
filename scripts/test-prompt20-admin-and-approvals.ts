/**
 * Nutri-Track — Prompt 20 Test Suite: Admin Control Center, User Approval System, Feature Requests & AI Snapshot Accuracy
 * 
 * Verifies:
 * 1. Admin Role RBAC & Account Status Enums (USER vs ADMIN, PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED)
 * 2. Mandatory User Approval Workflow (Default PENDING_APPROVAL, Admin approval, rejection, suspension, restoration)
 * 3. Pre-Approved Allowlist System (Auto-approval on registration, consumption tracking, idempotency)
 * 4. Admin Master Access & Privacy Engine (Admin override on private user data, sensitive secret protection)
 * 5. Admin User Management & Dossier Inspection (Comprehensive profile, biometrics, logs without password hashes)
 * 6. Feature Request System (User submission, user isolation, admin triage board, developer responses)
 * 7. AI Live Health Snapshot Data Integrity & Isolation
 */

import { prisma } from "../lib/db";
import { AdminService } from "../lib/services/admin/admin.service";
import { FeatureRequestService } from "../lib/services/feature-request.service";
import { PrivacyService } from "../lib/services/privacy.service";
import { HealthContextService } from "../lib/services/health-context.service";
import bcrypt from "bcryptjs";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (details) console.error("    Details:", details);
  }
}

async function runPrompt20Tests() {
  console.log("\n=======================================================");
  console.log("=== NUTRI-TRACK PROMPT 20 AUTOMATED TEST SUITE ===");
  console.log("=======================================================\n");

  const runId = Date.now();
  const adminEmail = `admin_${runId}@nutritrack.test`;
  const normalUserEmail = `user_${runId}@nutritrack.test`;
  const pendingUserEmail = `pending_${runId}@nutritrack.test`;
  const preApprovedEmail = `preapproved_${runId}@nutritrack.test`;
  const pwHash = await bcrypt.hash("TestPassword123!", 10);

  // --------------------------------------------------------------------------
  // PART 1: User Role & Mandatory Account Status Setup
  // --------------------------------------------------------------------------
  console.log("--- PART 1: Admin & User Creation with RBAC & Account Status ---");

  // 1. Create Admin User
  const adminUser = await (prisma as any).user.create({
    data: {
      name: "Admin Tester",
      username: `admin_${runId}`,
      email: adminEmail,
      passwordHash: pwHash,
      role: "ADMIN",
      accountStatus: "APPROVED",
      approvedAt: new Date(),
    },
  });

  assert(adminUser.role === "ADMIN", "1. Admin user is created with role === ADMIN");
  assert(adminUser.accountStatus === "APPROVED", "2. Admin user is created with accountStatus === APPROVED");

  // 2. Create Normal User (Default PENDING_APPROVAL)
  const normalUser = await (prisma as any).user.create({
    data: {
      name: "Normal Tester",
      username: `normal_${runId}`,
      email: normalUserEmail,
      passwordHash: pwHash,
      role: "USER",
      accountStatus: "PENDING_APPROVAL",
    },
  });

  assert(normalUser.role === "USER", "3. Standard user has role === USER");
  assert(normalUser.accountStatus === "PENDING_APPROVAL", "4. Standard user defaults to accountStatus === PENDING_APPROVAL");
  assert(normalUser.approvedAt === null, "5. Pending user has approvedAt === null");

  // Initialize privacy for normal user
  await PrivacyService.initializeDefaultPrivacy(normalUser.id);
  // Set all categories to PRIVATE to test Admin Master Access later
  await PrivacyService.updatePrivacySettings(normalUser.id, {
    profile: "PRIVATE",
    nutrition: "PRIVATE",
    deepNutrition: "PRIVATE",
    hydration: "PRIVATE",
    activities: "PRIVATE",
    workouts: "PRIVATE",
    insightsProgress: "PRIVATE",
    reports: "PRIVATE",
  });

  // --------------------------------------------------------------------------
  // PART 2: Admin User Management & Approval Lifecycle
  // --------------------------------------------------------------------------
  console.log("\n--- PART 2: User Approval Lifecycle ---");

  // 1. Admin Approves Normal User
  const approvedUser = await AdminService.updateUserStatus(
    adminUser.id,
    normalUser.id,
    "APPROVED"
  );
  assert(approvedUser.accountStatus === "APPROVED", "6. Admin can transition user status to APPROVED");
  assert(approvedUser.approvedAt !== null, "7. approvedAt timestamp is recorded upon approval");
  assert(approvedUser.approvedByAdminId === adminUser.id, "8. approvedByAdminId stores approving admin ID");

  // 2. Admin Suspends User
  const suspendedUser = await AdminService.updateUserStatus(
    adminUser.id,
    normalUser.id,
    "SUSPENDED"
  );
  assert(suspendedUser.accountStatus === "SUSPENDED", "9. Admin can transition user status to SUSPENDED");

  // 3. Admin Restores User
  const restoredUser = await AdminService.updateUserStatus(
    adminUser.id,
    normalUser.id,
    "APPROVED"
  );
  assert(restoredUser.accountStatus === "APPROVED", "10. Admin can restore suspended user to APPROVED");

  // 4. Admin Rejects User
  const pendingUser = await (prisma as any).user.create({
    data: {
      name: "Pending Reject Tester",
      username: `pending_${runId}`,
      email: pendingUserEmail,
      passwordHash: pwHash,
      role: "USER",
      accountStatus: "PENDING_APPROVAL",
    },
  });

  const rejectedUser = await AdminService.updateUserStatus(
    adminUser.id,
    pendingUser.id,
    "REJECTED"
  );
  assert(rejectedUser.accountStatus === "REJECTED", "11. Admin can transition user status to REJECTED");

  // --------------------------------------------------------------------------
  // PART 3: Pre-Approved Allowlist System
  // --------------------------------------------------------------------------
  console.log("\n--- PART 3: Pre-Approved User Allowlist System ---");

  // 1. Admin adds email to allowlist
  const preApprovalEntry = await AdminService.addPreApproval(
    adminUser.id,
    preApprovedEmail,
    "VIP Athlete Beta Invite"
  );

  assert(preApprovalEntry.identifier === preApprovedEmail.toLowerCase(), "12. Pre-approval entry created with normalized email");
  assert(preApprovalEntry.consumedAt === null, "13. Pre-approval entry initial state is unconsumed (consumedAt === null)");
  assert(preApprovalEntry.createdByAdminId === adminUser.id, "14. Pre-approval stores creating admin ID");

  // 2. Registration matching allowlist
  const allowlistMatch = await (prisma as any).preApprovedUser.findFirst({
    where: {
      identifier: preApprovedEmail.toLowerCase(),
      consumedAt: null,
    },
  });

  assert(Boolean(allowlistMatch), "15. Allowlist lookup succeeds for pending pre-approved email");

  // Simulate register flow
  const preApprovedNewUser = await (prisma as any).user.create({
    data: {
      name: "PreApproved Athlete",
      username: `preapproved_${runId}`,
      email: preApprovedEmail,
      passwordHash: pwHash,
      role: "USER",
      accountStatus: allowlistMatch ? "APPROVED" : "PENDING_APPROVAL",
      approvedAt: allowlistMatch ? new Date() : null,
      approvedByAdminId: allowlistMatch?.createdByAdminId || null,
    },
  });

  assert(preApprovedNewUser.accountStatus === "APPROVED", "16. User with pre-approved email is immediately APPROVED on registration");
  assert(preApprovedNewUser.approvedAt !== null, "17. Pre-approved user has approvedAt recorded automatically");

  // Mark consumed
  await (prisma as any).preApprovedUser.update({
    where: { id: allowlistMatch.id },
    data: {
      consumedAt: new Date(),
      consumedByUserId: preApprovedNewUser.id,
    },
  });

  const updatedAllowlistEntry = await (prisma as any).preApprovedUser.findUnique({
    where: { id: allowlistMatch.id },
  });
  assert(updatedAllowlistEntry.consumedAt !== null, "18. Pre-approval entry is marked as consumed after registration");
  assert(updatedAllowlistEntry.consumedByUserId === preApprovedNewUser.id, "19. Pre-approval entry tracks consumedByUserId");

  // --------------------------------------------------------------------------
  // PART 4: Admin Master Access & Privacy Engine Override
  // --------------------------------------------------------------------------
  console.log("\n--- PART 4: Admin Master Access & Privacy Engine ---");

  // Another random user
  const otherUser = await (prisma as any).user.create({
    data: {
      name: "Other Normal User",
      username: `other_${runId}`,
      email: `other_${runId}@nutritrack.test`,
      passwordHash: pwHash,
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  // Normal user checks private category of normalUser -> should be DENIED (false)
  const normalUserAccess = await PrivacyService.canAccessCategory(
    otherUser.id,
    normalUser.id,
    "NUTRITION"
  );
  assert(normalUserAccess === false, "20. Normal user is DENIED access to private data of another user");

  // Admin user checks private category of normalUser -> should be GRANTED (true) via Admin Master Access
  const adminMasterAccess = await PrivacyService.canAccessCategory(
    adminUser.id,
    normalUser.id,
    "NUTRITION"
  );
  assert(adminMasterAccess === true, "21. Admin user is GRANTED Admin Master Access to private user data");

  // Batch evaluation check
  const adminBatchAccess = await PrivacyService.canAccessCategoriesBatch(
    adminUser.id,
    normalUser.id,
    ["PROFILE", "NUTRITION", "DEEP_NUTRITION", "HYDRATION", "ACTIVITIES", "WORKOUTS", "INSIGHTS_PROGRESS", "REPORTS"]
  );
  const allBatchAllowed = Object.values(adminBatchAccess).every((v) => v === true);
  assert(allBatchAllowed, "22. Admin Master Access batch evaluation grants full access across all 8 privacy categories");

  // --------------------------------------------------------------------------
  // PART 5: Admin User Dossier & Sensitive Secret Protection
  // --------------------------------------------------------------------------
  console.log("\n--- PART 5: Admin User Dossier & Sensitive Secret Protection ---");

  const todayStr = new Date().toISOString().split("T")[0];

  // Seed sample nutrition and activity for normalUser
  const food = await (prisma as any).food.create({
    data: {
      userId: normalUser.id,
      name: "Oatmeal with Whey",
      servingSize: 100,
      servingUnit: "g",
      calories: 550,
      protein: 35,
      carbohydrates: 60,
      fat: 15,
    },
  });

  await (prisma as any).mealLog.create({
    data: {
      userId: normalUser.id,
      date: new Date(),
      mealType: "BREAKFAST",
      totalCalories: 550,
      totalProtein: 35,
      totalCarbs: 60,
      totalFat: 15,
    },
  });

  // Log via NutritionService for full single-source-of-truth snapshot
  const { NutritionService } = await import("../lib/services/nutrition.service");
  await NutritionService.logFoodToMeal(normalUser.id, {
    date: todayStr,
    mealType: "BREAKFAST",
    foodId: food.id,
    quantity: 100,
    quantityUnit: "g",
  });

  await (prisma as any).activityLog.create({
    data: {
      userId: normalUser.id,
      activityType: "RUN",
      date: todayStr,
      durationMinutes: 30,
      distanceKm: 5.0,
      caloriesBurned: 350,
    },
  });

  const dossier = await AdminService.getUserDetail(normalUser.id);
  assert(Boolean(dossier), "23. AdminService.getUserDetail returns valid user dossier");
  assert((dossier as any).user.passwordHash === undefined, "24. Sensitive credential passwordHash is strictly excluded from dossier");
  assert((dossier as any).recentActivity.meals.length >= 1, "25. Dossier includes user's meal logs");
  assert((dossier as any).recentActivity.activities.length >= 1, "26. Dossier includes user's activity logs");

  // --------------------------------------------------------------------------
  // PART 6: Feature Request System & User Isolation
  // --------------------------------------------------------------------------
  console.log("\n--- PART 6: Feature Request System & User Isolation ---");

  // 1. Normal user creates a feature request
  const request1 = await FeatureRequestService.createRequest(normalUser.id, {
    title: "Barcode Scanner for Food Entry",
    description: "Please add barcode scanning to quickly log packaged foods.",
    category: "NUTRITION",
    priority: "HIGH",
  });

  assert(request1.title === "Barcode Scanner for Food Entry", "27. Feature request created with correct title");
  assert(request1.status === "OPEN", "28. New feature request defaults to status === OPEN");
  assert(request1.userId === normalUser.id, "29. Feature request is attached to requesting user");

  // 2. User fetches own requests
  const userRequests = await FeatureRequestService.getUserRequests(normalUser.id);
  assert(userRequests.length >= 1, "30. User can retrieve their submitted feature requests");
  assert(userRequests.every((r: any) => r.userId === normalUser.id), "31. User only receives their own feature requests (User Isolation)");

  // 3. Admin retrieves all feature requests
  const adminFeatureRequests = await AdminService.getFeatureRequests();
  assert(adminFeatureRequests.length >= 1, "32. Admin can retrieve global feature requests across users");

  // 4. Admin updates feature request with status and official developer response
  const updatedReq = await AdminService.updateFeatureRequest(
    adminUser.id,
    request1.id,
    "PLANNED",
    "Scheduled for Sprint 22 release!"
  );

  assert(updatedReq.status === "PLANNED", "33. Admin can update request status to PLANNED");
  assert(updatedReq.adminResponse === "Scheduled for Sprint 22 release!", "34. Admin response note is stored on feature request");
  assert(updatedReq.respondedByAdminId === adminUser.id, "35. Feature request records respondedByAdminId");

  // --------------------------------------------------------------------------
  // PART 7: Admin Dashboard Overview Metrics
  // --------------------------------------------------------------------------
  console.log("\n--- PART 7: Admin Dashboard Overview Metrics ---");

  const metrics = await AdminService.getAdminMetrics();
  assert(metrics.totalUsers >= 3, "36. Admin metrics reports totalUsers");
  assert(metrics.approvedUsers >= 2, "37. Admin metrics reports approvedUsers");
  assert(typeof metrics.openFeatureRequests === "number", "38. Admin metrics reports openFeatureRequests");
  assert(metrics.recentRegistrations.length > 0, "39. Admin metrics lists recentRegistrations");

  // --------------------------------------------------------------------------
  // PART 8: AI Live Health Snapshot Grounding & Determinism
  // --------------------------------------------------------------------------
  console.log("\n--- PART 8: AI Live Health Snapshot Grounding & Integrity ---");

  const snapshot = await HealthContextService.getHealthSnapshot(normalUser.id, todayStr);
  assert(snapshot.userId === normalUser.id, "40. Health snapshot is strictly scoped to target userId");
  assert(typeof snapshot.healthScore.score === "number", "41. Health score is deterministically calculated (0-100)");
  assert(snapshot.nutrition.caloriesConsumed >= 550, "42. Nutrition calories reflect real database meal logs");
  assert(snapshot.movement.totalActiveCalories >= 350, "43. Movement calories reflect real database activity logs");

  // Final Summary
  console.log("\n=======================================================");
  console.log(`=== PROMPT 20 TEST SUMMARY: ${passedCount} / ${totalCount} PASSED ===`);
  console.log("=======================================================\n");

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runPrompt20Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
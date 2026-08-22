import { prisma } from "@/lib/db";
import { NotificationService } from "@/lib/services/notification.service";
import { calculateSafePercentage } from "@/lib/utils/data-state";

export interface ChallengeItemDto {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  durationDays: number;
  badgeIcon: string;
  isJoined: boolean;
  status: "JOINED" | "COMPLETED" | "ABANDONED" | null;
  currentProgress: number;
  progressPercentage: number;
  joinedAt: Date | null;
  completedAt: Date | null;
  participantCount: number;
}

export const SYSTEM_CHALLENGES = [
  {
    id: "CHALLENGE_7_DAY_HYDRATION",
    code: "CHALLENGE_7_DAY_HYDRATION",
    title: "7-Day Hydration Sprint",
    description: "Hit your daily hydration target for 7 days.",
    category: "HYDRATION",
    targetValue: 7,
    unit: "days",
    durationDays: 7,
    badgeIcon: "Droplets",
  },
  {
    id: "CHALLENGE_30_DAY_PROTEIN",
    code: "CHALLENGE_30_DAY_PROTEIN",
    title: "30-Day Protein Builder",
    description: "Hit your protein target for 30 days.",
    category: "NUTRITION",
    targetValue: 30,
    unit: "days",
    durationDays: 30,
    badgeIcon: "Utensils",
  },
  {
    id: "CHALLENGE_50K_RUN",
    code: "CHALLENGE_50K_RUN",
    title: "50K Running Month",
    description: "Accumulate 50 km in running activities over 30 days.",
    category: "RUNNING",
    targetValue: 50.0,
    unit: "km",
    durationDays: 30,
    badgeIcon: "Footprints",
  },
  {
    id: "CHALLENGE_12_WORKOUTS",
    code: "CHALLENGE_12_WORKOUTS",
    title: "12 Workouts in 30 Days",
    description: "Complete 12 gym or home workout sessions in 30 days.",
    category: "WORKOUTS",
    targetValue: 12,
    unit: "workouts",
    durationDays: 30,
    badgeIcon: "Dumbbell",
  },
  {
    id: "CHALLENGE_10K_STEPS_7D",
    code: "CHALLENGE_10K_STEPS_7D",
    title: "10,000 Steps for 7 Days",
    description: "Walk 10,000 steps daily for 7 days.",
    category: "ACTIVITIES",
    targetValue: 7,
    unit: "days",
    durationDays: 7,
    badgeIcon: "Footprints",
  },
];

export class ChallengeService {
  /**
   * Seed default system challenges
   */
  static async seedChallenges() {
    const pool = prisma as any;
    for (const c of SYSTEM_CHALLENGES) {
      await pool.challenge.upsert({
        where: { id: c.id },
        update: {
          ...c,
          isSystem: true,
          isPublic: true,
        },
        create: {
          ...c,
          isSystem: true,
          isPublic: true,
        },
      });
    }
  }

  /**
   * Get all challenges with user participation status and live real-data progress
   */
  static async getChallenges(userId: string): Promise<ChallengeItemDto[]> {
    await this.seedChallenges();
    const pool = prisma as any;

    const challenges = await pool.challenge.findMany({
      include: { participants: true },
    });

    const [meals, hydrations, activities, workouts, userSettings, userProfile] = await Promise.all([
      pool.mealLog.findMany({ where: { userId }, include: { entries: { include: { food: true } } } }),
      pool.hydrationLog.findMany({ where: { userId } }),
      pool.activityLog.findMany({ where: { userId } }),
      pool.workoutSession.findMany({ where: { userId } }),
      pool.userNutrientTarget.findUnique({ where: { userId } }),
      pool.userProfile.findUnique({ where: { userId } }),
    ]);

    const targetProtein = Number(userSettings?.proteinGrams || 100);
    const targetHydrationMl = Number(userProfile?.dailyHydrationTargetMl || 2500);

    const result: ChallengeItemDto[] = [];

    for (const ch of challenges) {
      const participant = (ch.participants || []).find((p: any) => p.userId === userId);
      const isJoined = Boolean(participant && participant.status !== "ABANDONED");
      const participantCount = (ch.participants || []).filter((p: any) => p.status !== "ABANDONED").length;

      let currentProgress = 0;
      let status: "JOINED" | "COMPLETED" | "ABANDONED" | null = participant ? participant.status : null;
      let completedAt: Date | null = participant?.completedAt || null;
      const joinedAt: Date | null = participant?.joinedAt || null;

      if (isJoined && joinedAt) {
        const joinDateStr = new Date(joinedAt).toISOString().split("T")[0];

        switch (ch.id) {
          case "CHALLENGE_7_DAY_HYDRATION": {
            const dailyHydrations = new Map<string, number>();
            for (const hl of hydrations) {
              if (hl.date >= joinDateStr) {
                dailyHydrations.set(hl.date, (dailyHydrations.get(hl.date) || 0) + Number(hl.amountMl));
              }
            }
            let days = 0;
            dailyHydrations.forEach((sum) => {
              if (sum >= targetHydrationMl) days++;
            });
            currentProgress = days;
            break;
          }
          case "CHALLENGE_30_DAY_PROTEIN": {
            const dailyMeals = new Map<string, number>();
            for (const ml of meals) {
              if (ml.date >= joinDateStr) {
                let pSum = dailyMeals.get(ml.date) || 0;
                for (const e of ml.entries || []) {
                  const factor = Number(e.quantity) / Number(e.food?.servingSize || 100);
                  pSum += Number(e.food?.protein || 0) * factor;
                }
                dailyMeals.set(ml.date, pSum);
              }
            }
            let days = 0;
            dailyMeals.forEach((sum) => {
              if (sum >= targetProtein) days++;
            });
            currentProgress = days;
            break;
          }
          case "CHALLENGE_50K_RUN": {
            const runs = activities.filter((a: any) => a.activityType === "RUN" && a.date >= joinDateStr);
            const totalKm = runs.reduce((sum: number, r: any) => sum + Number(r.distanceKm || 0), 0);
            currentProgress = Math.round(totalKm * 10) / 10;
            break;
          }
          case "CHALLENGE_12_WORKOUTS": {
            const joinedWorkouts = workouts.filter((w: any) => w.date >= joinDateStr);
            currentProgress = joinedWorkouts.length;
            break;
          }
          case "CHALLENGE_10K_STEPS_7D": {
            const dailySteps = new Map<string, number>();
            for (const a of activities) {
              if (a.date >= joinDateStr) {
                dailySteps.set(a.date, (dailySteps.get(a.date) || 0) + Number(a.steps || 0));
              }
            }
            let days = 0;
            dailySteps.forEach((sum) => {
              if (sum >= 10000) days++;
            });
            currentProgress = days;
            break;
          }
          default:
            currentProgress = participant?.currentProgress || 0;
        }

        // Check completion state
        if (currentProgress >= ch.targetValue && status !== "COMPLETED") {
          status = "COMPLETED";
          completedAt = new Date();
          await pool.challengeParticipant.update({
            where: { challengeId_userId: { challengeId: ch.id, userId } },
            data: {
              currentProgress,
              status: "COMPLETED",
              completedAt: completedAt.toISOString(),
            },
          });

          // Smart Notification for completed challenge
          await NotificationService.createNotification({
            userId,
            category: "CHALLENGE",
            type: "CHALLENGE_COMPLETED",
            title: `⚡ Challenge Completed: ${ch.title}`,
            message: `Awesome! You have successfully completed the "${ch.title}" challenge.`,
            actionUrl: `/goals?tab=challenges`,
            metadata: { challengeId: ch.id },
          });
        } else {
          await pool.challengeParticipant.update({
            where: { challengeId_userId: { challengeId: ch.id, userId } },
            data: { currentProgress },
          });
        }
      }

      const progressPercentage = calculateSafePercentage(currentProgress, ch.targetValue);

      result.push({
        id: ch.id,
        code: ch.code,
        title: ch.title,
        description: ch.description,
        category: ch.category,
        targetValue: ch.targetValue,
        unit: ch.unit,
        durationDays: ch.durationDays,
        badgeIcon: ch.badgeIcon,
        isJoined,
        status,
        currentProgress,
        progressPercentage,
        joinedAt,
        completedAt,
        participantCount,
      });
    }

    return result;
  }

  /**
   * Join a challenge
   */
  static async joinChallenge(userId: string, challengeId: string): Promise<ChallengeItemDto> {
    await this.seedChallenges();
    const pool = prisma as any;

    const challenge = await pool.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new Error("Challenge not found");

    const now = new Date().toISOString();
    await pool.challengeParticipant.upsert({
      where: { challengeId_userId: { challengeId, userId } },
      update: {
        status: "JOINED",
        joinedAt: now,
        completedAt: null,
      },
      create: {
        challengeId,
        userId,
        status: "JOINED",
        currentProgress: 0,
        joinedAt: now,
      },
    });

    await NotificationService.createNotification({
      userId,
      category: "CHALLENGE",
      type: "CHALLENGE_JOINED",
      title: `⚡ Joined Challenge: ${challenge.title}`,
      message: `You've entered the "${challenge.title}" challenge. Let's make it happen!`,
      actionUrl: `/goals?tab=challenges`,
      metadata: { challengeId },
    });

    const all = await this.getChallenges(userId);
    return all.find((c) => c.id === challengeId)!;
  }

  /**
   * Leave / Abandon a challenge
   */
  static async leaveChallenge(userId: string, challengeId: string): Promise<boolean> {
    const pool = prisma as any;
    const existing = await pool.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (!existing) return true;

    await pool.challengeParticipant.update({
      where: { challengeId_userId: { challengeId, userId } },
      data: { status: "ABANDONED" },
    });
    return true;
  }

  /**
   * Admin: Create and publish a new challenge
   */
  static async createChallenge(data: {
    title: string;
    description: string;
    category: string;
    targetValue: number;
    unit: string;
    durationDays: number;
    badgeIcon?: string;
    isPublic?: boolean;
  }) {
    const pool = prisma as any;
    const code = `CHALLENGE_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const id = code;

    const challenge = await pool.challenge.create({
      data: {
        id,
        code,
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        targetValue: Number(data.targetValue),
        unit: data.unit.trim(),
        durationDays: Number(data.durationDays || 30),
        badgeIcon: data.badgeIcon || "Trophy",
        isSystem: false,
        isPublic: data.isPublic !== false,
      },
    });

    return challenge;
  }

  /**
   * Admin: List all challenges with participant statistics
   */
  static async getAdminChallenges() {
    await this.seedChallenges();
    const pool = prisma as any;
    const challenges = await pool.challenge.findMany({
      include: { participants: true },
      orderBy: { createdAt: "desc" },
    });

    return challenges.map((ch: any) => ({
      id: ch.id,
      code: ch.code,
      title: ch.title,
      description: ch.description,
      category: ch.category,
      targetValue: ch.targetValue,
      unit: ch.unit,
      durationDays: ch.durationDays,
      badgeIcon: ch.badgeIcon,
      isSystem: ch.isSystem,
      isPublic: ch.isPublic,
      participantsCount: (ch.participants || []).filter((p: any) => p.status !== "ABANDONED").length,
      completionsCount: (ch.participants || []).filter((p: any) => p.status === "COMPLETED").length,
      createdAt: ch.createdAt,
    }));
  }

  /**
   * Admin: Delete a challenge
   */
  static async deleteChallenge(challengeId: string) {
    const pool = prisma as any;
    if (typeof pool.challengeParticipant?.deleteMany === "function") {
      await pool.challengeParticipant.deleteMany({ where: { challengeId } });
    }
    await pool.challenge.delete({ where: { id: challengeId } });
    return { success: true };
  }
}

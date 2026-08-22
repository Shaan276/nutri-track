import { prisma } from "@/lib/db";
import {
  LogWorkoutInput,
  UpdateWorkoutInput,
  WorkoutType,
} from "@/lib/validations/workout";

export interface WorkoutSetDto {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  distanceKm: number | null;
  notes: string | null;
}

export interface WorkoutExerciseDto {
  id: string;
  name: string;
  category: string | null;
  orderIndex: number;
  notes: string | null;
  sets: WorkoutSetDto[];
}

export interface WorkoutSessionDto {
  id: string;
  workoutType: WorkoutType;
  name: string;
  date: string;
  durationSeconds: number;
  caloriesBurned: number;
  notes: string | null;
  exercises: WorkoutExerciseDto[];
  totalSets: number;
  createdAt: string;
}

export interface DailyWorkoutsSummary {
  date: string;
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalCaloriesBurned: number;
  totalSetsCompleted: number;
  sessions: WorkoutSessionDto[];
}

export interface WeeklyWorkoutDayPoint {
  label: string;
  date: string;
  workoutsCount: number;
  durationSeconds: number;
  caloriesBurned: number;
  setsCount: number;
}

export interface WeeklyWorkoutsSummary {
  referenceDate: string;
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalCaloriesBurned: number;
  totalSetsCompleted: number;
  days: WeeklyWorkoutDayPoint[];
  typeDistribution: { homeCount: number; gymCount: number };
}

export class WorkoutService {
  /**
   * Logs a new workout session with exercises and individual sets
   */
  static async createWorkoutSession(userId: string, input: LogWorkoutInput): Promise<WorkoutSessionDto> {
    const session = await prisma.workoutSession.create({
      data: {
        userId,
        workoutType: input.workoutType || "GYM_WORKOUT",
        name: input.name.trim(),
        date: input.date,
        durationSeconds: input.durationSeconds || 0,
        caloriesBurned: input.caloriesBurned || 0,
        notes: input.notes ? input.notes.trim() : null,
        exercises: {
          create: (input.exercises || []).map((ex, exIdx) => ({
            name: ex.name.trim(),
            category: ex.category || null,
            orderIndex: ex.orderIndex ?? exIdx,
            notes: ex.notes || null,
            sets: {
              create: (ex.sets || []).map((st, stIdx) => ({
                setNumber: st.setNumber ?? stIdx + 1,
                reps: st.reps ?? null,
                weightKg: st.weightKg ?? null,
                durationSeconds: st.durationSeconds ?? null,
                distanceKm: st.distanceKm ?? null,
                notes: st.notes || null,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    return this.serializeWorkoutSession(session);
  }

  /**
   * Retrieves all workouts performed on a specific calendar date
   */
  static async getDailyWorkouts(userId: string, date: string): Promise<DailyWorkoutsSummary> {
    const rawSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        date,
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    const sessions = rawSessions.map((s: any) => this.serializeWorkoutSession(s));

    const totalDurationSeconds = sessions.reduce((sum: number, s: any) => sum + s.durationSeconds, 0);
    const totalCaloriesBurned = sessions.reduce((sum: number, s: any) => sum + s.caloriesBurned, 0);
    const totalSetsCompleted = sessions.reduce((sum: number, s: any) => sum + s.totalSets, 0);

    return {
      date,
      totalWorkouts: sessions.length,
      totalDurationSeconds,
      totalCaloriesBurned,
      totalSetsCompleted,
      sessions,
    };
  }

  /**
   * Retrieves 7-day workout frequency, training volume, and type breakdown
   */
  static async getWeeklyWorkoutsSummary(userId: string, referenceDate: string): Promise<WeeklyWorkoutsSummary> {
    const dateList: string[] = [];
    const [y, m, d] = referenceDate.split("-").map(Number);

    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() - i);
      dateList.push(dt.toISOString().split("T")[0]);
    }

    const allSessions = await prisma.workoutSession.findMany({
      where: { userId },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    let totalDuration = 0;
    let totalCalories = 0;
    let totalSets = 0;
    let homeCount = 0;
    let gymCount = 0;

    const days: WeeklyWorkoutDayPoint[] = dateList.map((dStr) => {
      const [yy, mm, dd] = dStr.split("-").map(Number);
      const dtObj = new Date(Date.UTC(yy, mm - 1, dd));
      const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(dtObj);

      const daySessions = allSessions.filter((s: any) => s.date === dStr);
      let dayDur = 0;
      let dayCals = 0;
      let daySets = 0;

      for (const s of daySessions) {
        dayDur += Number(s.durationSeconds || 0);
        dayCals += Number(s.caloriesBurned || 0);
        if (s.workoutType === "HOME_WORKOUT") homeCount++;
        else gymCount++;

        for (const ex of s.exercises || []) {
          daySets += (ex.sets || []).length;
        }
      }

      totalDuration += dayDur;
      totalCalories += dayCals;
      totalSets += daySets;

      return {
        label: weekday,
        date: dStr,
        workoutsCount: daySessions.length,
        durationSeconds: dayDur,
        caloriesBurned: dayCals,
        setsCount: daySets,
      };
    });

    const weeklyWorkoutsCount = days.reduce((sum, d) => sum + d.workoutsCount, 0);

    return {
      referenceDate,
      totalWorkouts: weeklyWorkoutsCount,
      totalDurationSeconds: totalDuration,
      totalCaloriesBurned: totalCalories,
      totalSetsCompleted: totalSets,
      days,
      typeDistribution: { homeCount, gymCount },
    };
  }

  /**
   * Retrieves single workout session by ID with ownership verification
   */
  static async getWorkoutById(userId: string, workoutId: string): Promise<WorkoutSessionDto> {
    const session = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error("NOT_FOUND");
    }

    if (session.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return this.serializeWorkoutSession(session);
  }

  /**
   * Updates an existing workout session with ownership verification
   */
  static async updateWorkoutSession(userId: string, workoutId: string, input: UpdateWorkoutInput) {
    const existing = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
    });

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    if (existing.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return prisma.workoutSession.update({
      where: { id: workoutId },
      data: {
        ...(input.workoutType !== undefined && { workoutType: input.workoutType }),
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.date !== undefined && { date: input.date }),
        ...(input.durationSeconds !== undefined && { durationSeconds: input.durationSeconds }),
        ...(input.caloriesBurned !== undefined && { caloriesBurned: input.caloriesBurned }),
        ...(input.notes !== undefined && { notes: input.notes ? input.notes.trim() : null }),
      },
    });
  }

  /**
   * Deletes an existing workout session with cascade deletion and ownership verification
   */
  static async deleteWorkoutSession(userId: string, workoutId: string) {
    const existing = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
    });

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    if (existing.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return prisma.workoutSession.delete({
      where: { id: workoutId },
    });
  }

  /**
   * Serializes a raw Prisma workout session to typed DTO
   */
  private static serializeWorkoutSession(s: any): WorkoutSessionDto {
    let totalSets = 0;

    const exercises: WorkoutExerciseDto[] = (s.exercises || []).map((ex: any) => {
      const sets: WorkoutSetDto[] = (ex.sets || []).map((st: any) => ({
        id: st.id,
        setNumber: Number(st.setNumber),
        reps: st.reps !== null && st.reps !== undefined ? Number(st.reps) : null,
        weightKg: st.weightKg !== null && st.weightKg !== undefined ? Number(st.weightKg) : null,
        durationSeconds: st.durationSeconds !== null && st.durationSeconds !== undefined ? Number(st.durationSeconds) : null,
        distanceKm: st.distanceKm !== null && st.distanceKm !== undefined ? Number(st.distanceKm) : null,
        notes: st.notes || null,
      }));

      totalSets += sets.length;

      return {
        id: ex.id,
        name: ex.name,
        category: ex.category || null,
        orderIndex: Number(ex.orderIndex || 0),
        notes: ex.notes || null,
        sets,
      };
    });

    return {
      id: s.id,
      workoutType: s.workoutType as WorkoutType,
      name: s.name,
      date: s.date,
      durationSeconds: Number(s.durationSeconds || 0),
      caloriesBurned: Number(s.caloriesBurned || 0),
      notes: s.notes || null,
      exercises,
      totalSets,
      createdAt: s.createdAt.toISOString ? s.createdAt.toISOString() : new Date(s.createdAt).toISOString(),
    };
  }
}

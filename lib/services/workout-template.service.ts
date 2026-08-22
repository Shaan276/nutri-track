import { prisma } from "@/lib/db";
import {
  CreateWorkoutTemplateInput,
  UpdateWorkoutTemplateInput,
  WorkoutTemplateDto,
  WorkoutTemplateExerciseDto,
} from "@/lib/validations/workout-template";
import { WorkoutType } from "@/lib/validations/workout";

export interface WorkoutTemplateFilters {
  search?: string;
  workoutType?: WorkoutType;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export class WorkoutTemplateService {
  /**
   * Retrieves all workout templates for an authenticated user matching query filters
   */
  static async getTemplates(
    userId: string,
    filters: WorkoutTemplateFilters = {}
  ): Promise<WorkoutTemplateDto[]> {
    const whereClause: any = { userId };

    if (filters.workoutType) {
      whereClause.workoutType = filters.workoutType;
    }
    if (filters.isFavorite !== undefined) {
      whereClause.isFavorite = filters.isFavorite;
    }
    if (filters.isArchived !== undefined) {
      whereClause.isArchived = filters.isArchived;
    } else {
      whereClause.isArchived = false; // Default: exclude archived routines
    }
    if (filters.search && filters.search.trim()) {
      whereClause.name = { contains: filters.search.trim() };
    }

    const templates = await prisma.workoutTemplate.findMany({
      where: whereClause,
      include: {
        exercises: true,
      },
    });

    return templates.map((t: any) => this.serializeTemplate(t));
  }

  /**
   * Retrieves a single template by ID with strict ownership validation
   */
  static async getTemplateById(
    userId: string,
    templateId: string
  ): Promise<WorkoutTemplateDto> {
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: {
        exercises: true,
      },
    });

    if (!template) {
      throw new Error("NOT_FOUND");
    }

    if (template.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return this.serializeTemplate(template);
  }

  /**
   * Creates a new workout routine blueprint
   */
  static async createTemplate(
    userId: string,
    input: CreateWorkoutTemplateInput
  ): Promise<WorkoutTemplateDto> {
    const created = await prisma.workoutTemplate.create({
      data: {
        userId,
        name: input.name.trim(),
        description: input.description ? input.description.trim() : null,
        workoutType: input.workoutType || "GYM_WORKOUT",
        isFavorite: Boolean(input.isFavorite),
        exercises: {
          create: input.exercises.map((ex, idx) => ({
            name: ex.name.trim(),
            category: ex.category ? ex.category.trim() : null,
            defaultSets: ex.defaultSets ?? 3,
            defaultReps: ex.defaultReps ?? null,
            defaultWeightKg: ex.defaultWeightKg !== undefined && ex.defaultWeightKg !== null ? ex.defaultWeightKg : null,
            defaultDurationSeconds: ex.defaultDurationSeconds ?? null,
            notes: ex.notes ? ex.notes.trim() : null,
            orderIndex: ex.orderIndex ?? idx,
          })),
        },
      },
      include: {
        exercises: true,
      },
    });

    return this.serializeTemplate(created);
  }

  /**
   * Updates an existing workout routine template
   */
  static async updateTemplate(
    userId: string,
    templateId: string,
    input: UpdateWorkoutTemplateInput
  ): Promise<WorkoutTemplateDto> {
    await this.getTemplateById(userId, templateId); // Ownership check

    const dataPayload: any = {};
    if (input.name !== undefined) dataPayload.name = input.name.trim();
    if (input.description !== undefined) dataPayload.description = input.description ? input.description.trim() : null;
    if (input.workoutType !== undefined) dataPayload.workoutType = input.workoutType;
    if (input.isFavorite !== undefined) dataPayload.isFavorite = input.isFavorite;
    if (input.isArchived !== undefined) dataPayload.isArchived = input.isArchived;

    if (input.exercises) {
      dataPayload.exercises = {
        deleteMany: {},
        create: input.exercises.map((ex, idx) => ({
          name: ex.name.trim(),
          category: ex.category ? ex.category.trim() : null,
          defaultSets: ex.defaultSets ?? 3,
          defaultReps: ex.defaultReps ?? null,
          defaultWeightKg: ex.defaultWeightKg !== undefined && ex.defaultWeightKg !== null ? ex.defaultWeightKg : null,
          defaultDurationSeconds: ex.defaultDurationSeconds ?? null,
          notes: ex.notes ? ex.notes.trim() : null,
          orderIndex: ex.orderIndex ?? idx,
        })),
      };
    }

    const updated = await prisma.workoutTemplate.update({
      where: { id: templateId },
      data: dataPayload,
      include: {
        exercises: true,
      },
    });

    return this.serializeTemplate(updated);
  }

  /**
   * Duplicates an existing workout template
   */
  static async duplicateTemplate(
    userId: string,
    templateId: string
  ): Promise<WorkoutTemplateDto> {
    const original = await this.getTemplateById(userId, templateId);

    const duplicated = await prisma.workoutTemplate.create({
      data: {
        userId,
        name: `${original.name} (Copy)`,
        description: original.description,
        workoutType: original.workoutType,
        isFavorite: false,
        exercises: {
          create: original.exercises.map((ex, idx) => ({
            name: ex.name,
            category: ex.category,
            defaultSets: ex.defaultSets,
            defaultReps: ex.defaultReps,
            defaultWeightKg: ex.defaultWeightKg,
            defaultDurationSeconds: ex.defaultDurationSeconds,
            notes: ex.notes,
            orderIndex: ex.orderIndex ?? idx,
          })),
        },
      },
      include: {
        exercises: true,
      },
    });

    return this.serializeTemplate(duplicated);
  }

  /**
   * Toggles favorite status for a template
   */
  static async toggleFavorite(userId: string, templateId: string): Promise<WorkoutTemplateDto> {
    const existing = await this.getTemplateById(userId, templateId);
    const updated = await prisma.workoutTemplate.update({
      where: { id: templateId },
      data: { isFavorite: !existing.isFavorite },
      include: { exercises: true },
    });
    return this.serializeTemplate(updated);
  }

  /**
   * Toggles archive status for a template
   */
  static async toggleArchive(userId: string, templateId: string): Promise<WorkoutTemplateDto> {
    const existing = await this.getTemplateById(userId, templateId);
    const updated = await prisma.workoutTemplate.update({
      where: { id: templateId },
      data: { isArchived: !existing.isArchived },
      include: { exercises: true },
    });
    return this.serializeTemplate(updated);
  }

  /**
   * Permanently deletes a workout template with cascading exercise removal
   */
  static async deleteTemplate(userId: string, templateId: string): Promise<{ success: boolean; id: string }> {
    await this.getTemplateById(userId, templateId); // Verify ownership
    await prisma.workoutTemplate.delete({
      where: { id: templateId },
    });
    return { success: true, id: templateId };
  }

  /**
   * Serializes raw database model to API DTO
   */
  private static serializeTemplate(raw: any): WorkoutTemplateDto {
    const exercises: WorkoutTemplateExerciseDto[] = (raw.exercises || []).map((ex: any) => ({
      id: ex.id,
      workoutTemplateId: ex.workoutTemplateId || ex.workout_template_id,
      name: ex.name,
      category: ex.category || null,
      defaultSets: Number(ex.defaultSets || ex.default_sets || 3),
      defaultReps: ex.defaultReps !== null && ex.defaultReps !== undefined ? Number(ex.defaultReps || ex.default_reps) : null,
      defaultWeightKg: ex.defaultWeightKg !== null && ex.defaultWeightKg !== undefined ? Number(ex.defaultWeightKg || ex.default_weight_kg) : null,
      defaultDurationSeconds: ex.defaultDurationSeconds !== null && ex.defaultDurationSeconds !== undefined ? Number(ex.defaultDurationSeconds || ex.default_duration_seconds) : null,
      notes: ex.notes || null,
      orderIndex: Number(ex.orderIndex || ex.order_index || 0),
      createdAt: ex.createdAt instanceof Date ? ex.createdAt.toISOString() : String(ex.createdAt || ex.created_at || ""),
      updatedAt: ex.updatedAt instanceof Date ? ex.updatedAt.toISOString() : String(ex.updatedAt || ex.updated_at || ""),
    }));

    return {
      id: raw.id,
      userId: raw.userId || raw.user_id,
      name: raw.name,
      description: raw.description || null,
      workoutType: raw.workoutType || raw.workout_type || "GYM_WORKOUT",
      isFavorite: Boolean(raw.isFavorite ?? raw.is_favorite),
      isArchived: Boolean(raw.isArchived ?? raw.is_archived),
      exercises,
      totalExercises: exercises.length,
      createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt || raw.created_at || ""),
      updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt || raw.updated_at || ""),
    };
  }
}

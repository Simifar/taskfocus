import { z } from "zod";

import { isValidDateInput } from "@/shared/lib/dates/date-only";
import {
  DEFAULT_ENERGY_LEVEL,
  DEFAULT_SUBTASK_ENERGY_LEVEL,
  MAX_ENERGY_LEVEL,
  MIN_ENERGY_LEVEL,
} from "@/server/tasks/policy";

export const taskStatusSchema = z.enum(["active", "completed", "archived"]);
export const taskViewSchema = z.enum(["today", "inbox", "week", "day", "calendar", "archive"]);
export const taskDateSchema = z.string().refine(isValidDateInput, "Некорректная дата");

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Название обязательно").max(200),
  description: z.string().max(2000).nullish(),
  important: z.boolean().default(false),
  urgent: z.boolean().default(false),
  energyLevel: z.number().int().min(MIN_ENERGY_LEVEL).max(MAX_ENERGY_LEVEL).default(DEFAULT_ENERGY_LEVEL),
  dueDateStart: taskDateSchema.nullish(),
  dueDateEnd: taskDateSchema.nullish(),
  parentTaskId: z.string().nullish(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  important: z.boolean().optional(),
  urgent: z.boolean().optional(),
  energyLevel: z.number().int().min(MIN_ENERGY_LEVEL).max(MAX_ENERGY_LEVEL).optional(),
  status: taskStatusSchema.optional(),
  dueDateStart: taskDateSchema.nullish(),
  dueDateEnd: taskDateSchema.nullish(),
});

export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), position: z.number().int().min(0) }))
    .min(1)
    .max(100),
});

export const createSubtaskSchema = z.object({
  parentId: z.string().min(1, "ID родительской задачи обязателен"),
  title: z.string().trim().min(1, "Название обязательно").max(200),
  energyLevel: z
    .number()
    .int()
    .min(MIN_ENERGY_LEVEL)
    .max(MAX_ENERGY_LEVEL)
    .optional()
    .default(DEFAULT_SUBTASK_ENERGY_LEVEL),
});

export const batchTaskSchema = z.object({
  action: z.enum(["archive", "delete", "assign-range"]),
  taskIds: z.array(z.string().min(1)).min(1).max(100),
  dueDateStart: taskDateSchema.nullish(),
  dueDateEnd: taskDateSchema.nullish(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type BatchTaskInput = z.infer<typeof batchTaskSchema>;

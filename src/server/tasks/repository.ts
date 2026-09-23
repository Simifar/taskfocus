import type { Prisma, PrismaClient } from "@prisma/client";

export type TaskDb = PrismaClient | Prisma.TransactionClient;

export function findOwnedTask(client: TaskDb, userId: string, id: string) {
  return client.task.findFirst({
    where: { id, userId },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });
}

export function findOwnedTaskSnapshot(client: TaskDb, userId: string, id: string) {
  return client.task.findFirst({
    where: { id, userId },
    select: {
      id: true,
      userId: true,
      status: true,
      dueDateStart: true,
      dueDateEnd: true,
      parentTaskId: true,
    },
  });
}

export function findOwnedTaskSnapshots(client: TaskDb, userId: string, ids: string[]) {
  return client.task.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, userId: true, status: true, parentTaskId: true },
  });
}

export function findTasks(client: TaskDb, where: Prisma.TaskWhereInput) {
  return client.task.findMany({
    where,
    include: { subtasks: { orderBy: { position: "asc" } } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
}

export function countTasks(client: TaskDb, where: Prisma.TaskWhereInput) {
  return client.task.count({ where });
}

export function findMaxPosition(client: TaskDb, userId: string, parentTaskId: string | null) {
  return client.task.aggregate({
    where: { userId, parentTaskId },
    _max: { position: true },
  });
}

export function createTask(client: TaskDb, data: Prisma.TaskUncheckedCreateInput) {
  return client.task.create({
    data,
    include: { subtasks: true },
  });
}

export function updateTask(client: TaskDb, id: string, data: Prisma.TaskUpdateInput) {
  return client.task.update({
    where: { id },
    data,
    include: { subtasks: true },
  });
}

export function deleteTask(client: TaskDb, id: string) {
  return client.task.delete({ where: { id } });
}

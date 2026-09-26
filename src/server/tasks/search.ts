import type { Prisma } from "@prisma/client";

export function buildTaskSearchFilter(search: string, userId: string): Prisma.TaskWhereInput {
  const term = search.trim();
  return {
    OR: [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      {
        subtasks: {
          some: {
            userId,
            OR: [
              { title: { contains: term, mode: "insensitive" } },
              { description: { contains: term, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}

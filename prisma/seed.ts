import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = "demo@taskfocus.app";
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      username: "demo",
      name: "Demo User",
      passwordHash,
    },
  });

  await db.task.deleteMany({ where: { userId: user.id } });

  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const parent = await db.task.create({
    data: {
      userId: user.id,
      title: "Закончить черновик диплома",
      description: "Финализировать раздел про архитектуру и реализацию",
      priority: "high",
      energyLevel: 4,
      position: 0,
      dueDateStart: today,
      dueDateEnd: nextWeek,
    },
  });

  await db.task.createMany({
    data: [
      {
        userId: user.id,
        parentTaskId: parent.id,
        title: "Глава 2 — обзор аналогов",
        priority: "medium",
        energyLevel: 3,
        position: 0,
      },
      {
        userId: user.id,
        parentTaskId: parent.id,
        title: "Глава 3 — архитектура",
        priority: "high",
        energyLevel: 4,
        position: 1,
      },
    ],
  });

  await db.task.createMany({
    data: [
      {
        userId: user.id,
        title: "Купить продукты",
        priority: "low",
        energyLevel: 1,
        position: 1,
        dueDateStart: today,
        dueDateEnd: today,
      },
      {
        userId: user.id,
        title: "Прочитать главу про React Server Components",
        priority: "medium",
        energyLevel: 3,
        position: 2,
        dueDateStart: today,
        dueDateEnd: tomorrow,
      },
      {
        userId: user.id,
        title: "Разобрать inbox задач без даты",
        priority: "low",
        energyLevel: 2,
        position: 3,
      },
    ],
  });

  console.log(`Seeded demo data for ${email} (password: demo1234)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

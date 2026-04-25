import { PrismaClient, type TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(9, 0, 0, 0);
  return next;
}

type DemoTaskInput = {
  title: string;
  description?: string;
  important: boolean;
  urgent: boolean;
  energyLevel: number;
  position: number;
  dueDateStart?: Date;
  dueDateEnd?: Date;
  status?: TaskStatus;
  completedAt?: Date;
};

async function createTask(userId: string, input: DemoTaskInput) {
  return db.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      important: input.important,
      urgent: input.urgent,
      energyLevel: input.energyLevel,
      position: input.position,
      dueDateStart: input.dueDateStart ?? null,
      dueDateEnd: input.dueDateEnd ?? null,
      status: input.status ?? "active",
      completedAt: input.completedAt ?? null,
    },
  });
}

async function main() {
  const email = "demo@taskfocus.app";
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await db.user.upsert({
    where: { email },
    update: {
      username: "demo",
      name: "Demo User",
      passwordHash,
    },
    create: {
      email,
      username: "demo",
      name: "Demo User",
      passwordHash,
    },
  });

  await db.task.deleteMany({ where: { userId: user.id } });

  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const inThreeDays = addDays(today, 3);
  const nextWeek = addDays(today, 7);
  const nextMonth = addDays(today, 28);

  const diploma = await createTask(user.id, {
    title: "Закончить демонстрационный сценарий диплома",
    description:
      "Проверить, что TaskFocus показывает полный цикл: сбор задач, матрицу Эйзенхауэра, план на день, подзадачи и статистику.",
    important: true,
    urgent: true,
    energyLevel: 5,
    position: 0,
    dueDateStart: today,
    dueDateEnd: inThreeDays,
  });

  await db.task.createMany({
    data: [
      {
        userId: user.id,
        parentTaskId: diploma.id,
        title: "Открыть демо-аккаунт и показать inbox",
        important: true,
        urgent: true,
        energyLevel: 2,
        position: 0,
        status: "completed",
        completedAt: yesterday,
      },
      {
        userId: user.id,
        parentTaskId: diploma.id,
        title: "Показать ограничение пяти активных задач на сегодня",
        important: true,
        urgent: true,
        energyLevel: 3,
        position: 1,
      },
      {
        userId: user.id,
        parentTaskId: diploma.id,
        title: "Продемонстрировать редактирование энергии и срочности",
        important: true,
        urgent: false,
        energyLevel: 3,
        position: 2,
      },
      {
        userId: user.id,
        parentTaskId: diploma.id,
        title: "Завершить одну подзадачу во время показа",
        important: false,
        urgent: true,
        energyLevel: 1,
        position: 3,
      },
    ],
  });

  const chapter = await createTask(user.id, {
    title: "Доработать главу 3 про архитектуру TaskFocus",
    description:
      "Сверить текст диплома с текущей реализацией: Next.js Route Handlers, Prisma, авторизация, задачи и статистика.",
    important: true,
    urgent: false,
    energyLevel: 4,
    position: 1,
    dueDateStart: tomorrow,
    dueDateEnd: nextWeek,
  });

  await db.task.createMany({
    data: [
      {
        userId: user.id,
        parentTaskId: chapter.id,
        title: "Обновить диаграмму архитектуры",
        important: true,
        urgent: false,
        energyLevel: 3,
        position: 0,
      },
      {
        userId: user.id,
        parentTaskId: chapter.id,
        title: "Описать ограничения MVP",
        important: true,
        urgent: false,
        energyLevel: 2,
        position: 1,
      },
      {
        userId: user.id,
        parentTaskId: chapter.id,
        title: "Добавить выводы по пользовательскому сценарию",
        important: true,
        urgent: false,
        energyLevel: 4,
        position: 2,
      },
    ],
  });

  const demoPrep = await createTask(user.id, {
    title: "Подготовить короткое live demo",
    description:
      "Собрать маршрут показа на 5-7 минут: вход, создание задачи, фильтрация, подзадачи, завершение и статистика.",
    important: true,
    urgent: true,
    energyLevel: 3,
    position: 2,
    dueDateStart: today,
    dueDateEnd: today,
  });

  await db.task.createMany({
    data: [
      {
        userId: user.id,
        parentTaskId: demoPrep.id,
        title: "Проверить логин demo@taskfocus.app",
        important: true,
        urgent: true,
        energyLevel: 1,
        position: 0,
        status: "completed",
        completedAt: today,
      },
      {
        userId: user.id,
        parentTaskId: demoPrep.id,
        title: "Очистить лишние вкладки перед записью",
        important: false,
        urgent: true,
        energyLevel: 1,
        position: 1,
      },
      {
        userId: user.id,
        parentTaskId: demoPrep.id,
        title: "Сделать резервный скриншот dashboard",
        important: false,
        urgent: true,
        energyLevel: 2,
        position: 2,
      },
    ],
  });

  await db.task.createMany({
    data: [
      {
        userId: user.id,
        title: "Ответить научному руководителю",
        description: "Коротко отправить статус, ссылку на репозиторий и список того, что осталось перед защитой.",
        important: true,
        urgent: true,
        energyLevel: 2,
        position: 3,
        dueDateStart: today,
        dueDateEnd: today,
      },
      {
        userId: user.id,
        title: "Разобрать inbox без даты",
        description: "Пройтись по накопленным идеям и решить: запланировать, удалить или превратить в подзадачи.",
        important: false,
        urgent: false,
        energyLevel: 2,
        position: 4,
      },
      {
        userId: user.id,
        title: "Купить маркеры и стикеры для защиты",
        important: false,
        urgent: true,
        energyLevel: 1,
        position: 5,
        dueDateStart: today,
        dueDateEnd: today,
      },
      {
        userId: user.id,
        title: "Прочитать статью про когнитивную нагрузку",
        description: "Найти 2-3 формулировки для обоснования мягкого планирования и ограничения дневной нагрузки.",
        important: true,
        urgent: false,
        energyLevel: 3,
        position: 6,
        dueDateStart: tomorrow,
        dueDateEnd: nextWeek,
      },
      {
        userId: user.id,
        title: "Настроить резервную копию базы Neon",
        description: "Проверить переменные окружения и убедиться, что seed можно безопасно запускать для демо.",
        important: true,
        urgent: false,
        energyLevel: 4,
        position: 7,
        dueDateStart: inThreeDays,
        dueDateEnd: nextWeek,
      },
      {
        userId: user.id,
        title: "Выбрать музыку для фокус-сессии",
        important: false,
        urgent: false,
        energyLevel: 1,
        position: 8,
      },
      {
        userId: user.id,
        title: "Проверить README перед публикацией",
        description: "Сверить команды запуска, демо-логин и описание основных функций.",
        important: true,
        urgent: true,
        energyLevel: 3,
        position: 9,
        dueDateStart: tomorrow,
        dueDateEnd: tomorrow,
      },
      {
        userId: user.id,
        title: "Собрать вопросы для пользовательского теста",
        description: "Спросить про понятность энергии, матрицы важности и ограничения задач на день.",
        important: true,
        urgent: false,
        energyLevel: 3,
        position: 10,
        dueDateStart: nextWeek,
        dueDateEnd: nextMonth,
      },
      {
        userId: user.id,
        title: "Удалить старые черновые задачи после демо",
        important: false,
        urgent: false,
        energyLevel: 1,
        position: 11,
        status: "archived",
      },
      {
        userId: user.id,
        title: "Сверить тексты ошибок в API задач",
        description: "Проверить, что русские сообщения отображаются без проблем с кодировкой.",
        important: true,
        urgent: false,
        energyLevel: 2,
        position: 12,
        status: "completed",
        completedAt: yesterday,
      },
      {
        userId: user.id,
        title: "Записать короткий changelog для v0.3",
        important: false,
        urgent: true,
        energyLevel: 2,
        position: 13,
        status: "completed",
        completedAt: today,
      },
    ],
  });

  const counts = await db.task.groupBy({
    by: ["status"],
    where: { userId: user.id },
    _count: { _all: true },
  });

  console.log(`Seeded demo data for ${email} (password: demo1234)`);
  console.table(
    counts.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

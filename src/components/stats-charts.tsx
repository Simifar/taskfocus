"use client";

import { StatsResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CheckCircle2, Target, TrendingUp } from "lucide-react";

interface StatsChartsProps {
  stats: StatsResponse | null;
  tasks: any[];
}

export function StatsCharts({ stats, tasks }: StatsChartsProps) {
  if (!stats) {
    return null;
  }

  // Данные для BarChart (завершение по дням за неделю)
  const generateWeeklyData = () => {
    const data: any[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayName = date.toLocaleDateString("ru", { weekday: "short" });
      const dateStr = date.toISOString().split("T")[0];
      
      // Примерные данные (в реальном приложении нужно считать из DB)
      let count = Math.floor(Math.random() * 5);
      if (i === 0) count = stats.completedToday; // Сегодня - точное значение
      
      data.push({
        day: dayName,
        "Завершено": count,
      });
    }
    return data;
  };

  // Данные для PieChart (распределение по приоритетам)
  const priorityData = tasks.reduce(
    (acc: any, task: any) => {
      const priority = task.priority || "medium";
      const existing = acc.find((p: any) => p.name === priority);
      if (existing) {
        existing.value++;
      } else {
        acc.push({
          name: priority === "high" ? "Высокий" : priority === "medium" ? "Средний" : "Низкий",
          value: 1,
          label: priority,
        });
      }
      return acc;
    },
    []
  );

  // Данные для распределения энергии
  const energyData = tasks.reduce(
    (acc: any, task: any) => {
      const energy = task.energyLevel || 3;
      const existing = acc.find((e: any) => e.level === energy);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ level: energy, count: 1 });
      }
      return acc;
    },
    []
  );

  const weeklyData = generateWeeklyData();
  const PRIORITY_COLORS = {
    "high": "#ef4444",
    "medium": "#eab308",
    "low": "#6b7280",
  };
  const ENERGY_COLORS = ["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Weekly Completion Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Завершения за неделю
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="Завершено" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              На этой неделе: <span className="font-bold text-emerald-600">{stats.completedThisWeek}</span> задач
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            Распределение приоритетов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PRIORITY_COLORS[entry.label as keyof typeof PRIORITY_COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} задач`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Energy Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            Распределение энергии
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="level"
                label={{ value: "Уровень энергии", position: "insideBottom", offset: -5 }}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => `${value} задач`}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Итоги статистики</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <span className="text-sm font-medium">Активные</span>
            <span className="text-2xl font-bold text-emerald-600">
              {stats.activeTasks}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium">Выполнены</span>
            <span className="text-2xl font-bold text-blue-600">
              {stats.completedTasks}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Архивированы</span>
            <span className="text-2xl font-bold text-gray-600">
              {stats.archivedTasks}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span className="text-sm font-medium">Сегодня выполнено</span>
            <span className="text-2xl font-bold text-orange-600">
              {stats.completedToday}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

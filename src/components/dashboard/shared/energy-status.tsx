"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnergyStatusProps {
  currentEnergy: number | null;
  onEnergyChange: (level: number | null) => void;
  isLoading?: boolean;
}

const ENERGY_DESCRIPTIONS = {
  1: "Low energy - great for simple tasks",
  2: "Low-medium - good for routine tasks",
  3: "Medium - perfect for balanced work",
  4: "High energy - tackle complex projects",
  5: "Peak energy - go big!",
};

const ENERGY_COLORS = {
  1: "bg-green-500",
  2: "bg-lime-500",
  3: "bg-yellow-500",
  4: "bg-orange-500",
  5: "bg-red-500",
};

const ENERGY_BG_COLORS = {
  1: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  2: "bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800",
  3: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
  4: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  5: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

function getEnergyIcon(level: number) {
  if (level <= 1) return <BatteryLow className="h-5 w-5" />;
  if (level <= 2) return <BatteryMedium className="h-5 w-5" />;
  if (level <= 3) return <Battery className="h-5 w-5" />;
  if (level <= 4) return <BatteryFull className="h-5 w-5" />;
  return <BatteryFull className="h-5 w-5" />;
}

export function EnergyStatus({
  currentEnergy,
  onEnergyChange,
  isLoading = false,
}: EnergyStatusProps) {
  if (currentEnergy === null) {
    return (
      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-6">
          <div className="text-center">
            <Zap className="h-8 w-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold mb-2">What's your energy level?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your current energy to filter matching tasks
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  onClick={() => onEnergyChange(level)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-1",
                    ENERGY_BG_COLORS[level as keyof typeof ENERGY_BG_COLORS]
                  )}
                >
                  {getEnergyIcon(level)}
                  <span>{level}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = (currentEnergy / 5) * 100;
  const colorClass = ENERGY_COLORS[currentEnergy as keyof typeof ENERGY_COLORS];
  const bgColorClass = ENERGY_BG_COLORS[currentEnergy as keyof typeof ENERGY_BG_COLORS];

  return (
    <Card className={cn("mb-6 border", bgColorClass)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Your Energy Level
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getEnergyIcon(currentEnergy)}
            <div>
              <p className="font-semibold">{currentEnergy} / 5</p>
              <p className="text-sm text-muted-foreground">
                {ENERGY_DESCRIPTIONS[currentEnergy as keyof typeof ENERGY_DESCRIPTIONS]}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEnergyChange(null)}
            disabled={isLoading}
          >
            Clear
          </Button>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Showing tasks for energy level {currentEnergy} and below
        </p>
      </CardContent>
    </Card>
  );
}

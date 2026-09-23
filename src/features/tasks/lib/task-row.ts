import { format, isValid } from "date-fns";
import { ru } from "date-fns/locale";

type TaskRowSchedule = {
  dueDateStart?: string | null;
  dueDateEnd?: string | null;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? date : null;
}

export function formatTaskRowSchedule({
  dueDateStart,
  dueDateEnd,
}: TaskRowSchedule): string | null {
  const start = parseDate(dueDateStart);
  const end = parseDate(dueDateEnd);
  const first = start ?? end;

  if (!first) return null;

  const firstLabel = format(first, "d MMM", { locale: ru });
  if (!end || !start || format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return firstLabel;
  }

  const endLabel = format(end, "d MMM", { locale: ru });
  if (format(start, "yyyy-MM") === format(end, "yyyy-MM")) {
    return `${format(start, "d")}–${endLabel}`;
  }
  return `${firstLabel}–${endLabel}`;
}

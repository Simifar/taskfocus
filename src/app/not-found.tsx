import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { StatusShell } from "@/shared/ui/status-shell";

export default function NotFound() {
  return (
    <StatusShell>
      <Compass className="mx-auto mb-5 size-12 text-brand" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ошибка 404</p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight">Страница не найдена</h1>
      <p className="mt-3 text-sm text-muted-foreground">Ссылка могла измениться. Вернитесь в своё рабочее пространство.</p>
      <Button asChild className="mt-6"><Link href="/"><ArrowLeft /> К задачам</Link></Button>
    </StatusShell>
  );
}

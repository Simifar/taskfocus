import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { StatusShell } from "@/shared/ui/status-shell";

export default function ForgotPasswordPage() {
  return (
    <StatusShell>
        <div>
          <div className="mx-auto w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <LockKeyhole className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-2xl font-semibold leading-tight">Восстановление пароля</h1>
          <p className="mt-3 text-sm font-medium text-brand">Эта функция пока недоступна</p>
        </div>
        <div className="mt-4 space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            В TaskFocus ещё не настроена отправка писем для сброса пароля. Ничего не отправлено и пароль не изменён.
          </p>
          <Button asChild variant="outline" className="w-full"><Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться ко входу
            </Link></Button>
        </div>
    </StatusShell>
  );
}

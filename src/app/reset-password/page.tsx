import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <LockKeyhole className="w-6 h-6 text-brand" />
          </div>
          <CardTitle className="text-2xl font-bold">Сброс пароля</CardTitle>
          <CardDescription>Эта функция пока недоступна</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Ссылка сброса пароля не создаётся, поэтому пароль не изменён.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться ко входу
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

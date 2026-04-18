"use client";

import { useState } from "react";
import { useLogin, useRegister } from "@/features/auth/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AlertCircle, Brain, CheckCircle, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/shared/ui/alert";

function describe(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const login = useLogin();
  const register = useRegister();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email: loginEmail, password: loginPassword });
      toast.success("Добро пожаловать!");
    } catch (err) {
      setError(describe(err, "Ошибка соединения"));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({
        email: registerEmail,
        username: registerUsername,
        password: registerPassword,
      });
      if (registerName.trim()) {
        // best-effort post-register name update is handled in Profile page
      }
      toast.success("Аккаунт создан! Добро пожаловать!");
    } catch (err) {
      setError(describe(err, "Ошибка соединения"));
    }
  };

  const isLoading = login.isPending || register.isPending;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 lg:p-16 flex flex-col justify-center text-white">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 rounded-xl">
              <Brain className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-bold">TaskFocus</h1>
          </div>

          <h2 className="text-2xl lg:text-3xl font-semibold mb-6">
            Интеллектуальный менеджер задач для людей с СДВГ
          </h2>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg mt-0.5">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Фокус на главном</p>
                <p className="text-white/80 text-sm">Структурируйте задачи так, как удобно вам</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg mt-0.5">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Учёт уровня энергии</p>
                <p className="text-white/80 text-sm">Выбирайте задачи по своим силам прямо сейчас</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg mt-0.5">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Мягкие дедлайны</p>
                <p className="text-white/80 text-sm">Диапазон дат вместо точного срока — меньше стресса</p>
              </div>
            </div>
          </div>

          <p className="text-white/70 text-sm">
            Разработано с учётом нейробиологических особенностей внимания
          </p>
        </div>
      </div>

      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Войти в аккаунт</CardTitle>
                  <CardDescription>Введите свои данные для входа</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="user@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Пароль</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6">
                    <Button className="w-full" type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Войти
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Создать аккаунт</CardTitle>
                  <CardDescription>Зарегистрируйтесь бесплатно</CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="user@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Имя пользователя</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="username"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                        minLength={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Имя (опционально)</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Иван Иванов"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Пароль</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Зарегистрироваться
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

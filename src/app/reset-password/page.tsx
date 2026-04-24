'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { AlertCircle, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/alert';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const tokenError = token
    ? ''
    : 'Отсутствует токен сброса пароля. Пожалуйста, используйте ссылку из письма.';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    // Заглушка - просто показываем успех
    setIsSuccess(true);
    setError('');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-brand" />
            </div>
            <CardTitle className="text-2xl font-bold">Пароль изменён!</CardTitle>
            <CardDescription>
              Ваш пароль был успешно обновлён
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Теперь вы можете войти в аккаунт с новым паролем.
            </p>
            
            <div className="flex flex-col space-y-2">
              <Link href="/auth">
                <Button className="w-full">
                  Перейти к входу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Ошибка токена</CardTitle>
            <CardDescription>
              Ссылка для сброса пароля недействительна
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              {tokenError}
            </p>
            
            <div className="flex flex-col space-y-2">
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full">
                  Запросить новую ссылку
                </Button>
              </Link>
              
              <Link href="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Вернуться к входу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-brand" />
          </div>
          <CardTitle className="text-2xl font-bold">Сброс пароля</CardTitle>
          <CardDescription>
            Создайте новый пароль для вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Новый пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password && password.length < 8 && (
                <p className="text-xs text-red-600 mt-1">
                  Пароль должен содержать минимум 8 символов
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Подтвердите пароль</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Повторите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1">
                  Пароли не совпадают
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full">
              Установить новый пароль
            </Button>
            
            <div className="text-center">
              <Link 
                href="/auth"
                className="text-sm text-brand hover:text-brand/80"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Вернуться к входу
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

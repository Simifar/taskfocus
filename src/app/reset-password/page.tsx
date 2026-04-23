'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useResetPassword } from '@/features/auth/hooks';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Loader2, Lock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const resetPassword = useResetPassword();

  useEffect(() => {
    if (!token) {
      setTokenError('Отсутствует токен сброса пароля. Пожалуйста, используйте ссылку из письма.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      return;
    }

    if (password.length < 8) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }
    
    try {
      await resetPassword.mutateAsync({ token, password });
      setIsSuccess(true);
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Ошибка токена</CardTitle>
            <CardDescription>
              {tokenError}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Убедитесь, что вы используете полную ссылку из письма</p>
              <p>• Токен мог истечь (действителен 1 час)</p>
              <p>• Запросите новый сброс пароля, если нужно</p>
            </div>
            
            <div className="flex flex-col space-y-2 pt-4">
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full">
                  Запросить новый сброс
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Пароль изменён!</CardTitle>
            <CardDescription>
              Ваш пароль успешно обновлён
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Теперь вы можете войти с новым паролем.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2 pt-4">
              <Link href="/auth">
                <Button className="w-full">
                  Перейти ко входу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFormValid = password.length >= 8 && password === confirmPassword && !resetPassword.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Новый пароль</CardTitle>
          <CardDescription>
            Установите новый пароль для вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Новый пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={resetPassword.isPending}
              />
              {password && password.length < 8 && (
                <p className="text-sm text-red-600">Пароль должен содержать минимум 8 символов</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={resetPassword.isPending}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600">Пароли не совпадают</p>
              )}
            </div>

            {resetPassword.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {resetPassword.error.message || 'Произошла ошибка. Попробуйте ещё раз.'}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!isFormValid || !token}
            >
              {resetPassword.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Установить новый пароль'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth"
              className="text-sm text-emerald-600 hover:text-emerald-700 inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Вернуться к входу
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

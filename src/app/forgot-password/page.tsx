'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForgotPassword } from '@/features/auth/hooks';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  
  const forgotPassword = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await forgotPassword.mutateAsync({ email });
      setIsSuccess(true);
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Проверьте почту</CardTitle>
            <CardDescription>
              Мы отправили инструкции по сбросу пароля на указанный email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Если аккаунт с email <strong>{email}</strong> существует, вы получите письмо с инструкциями.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Проверьте папку "Спам", если письмо не пришло</p>
              <p>• Ссылка действительна в течение 1 часа</p>
            </div>
            
            <div className="flex flex-col space-y-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsSuccess(false)}
                className="w-full"
              >
                Отправить ещё раз
              </Button>
              
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Забыли пароль?</CardTitle>
          <CardDescription>
            Введите email и мы отправим инструкции по сбросу пароля
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={forgotPassword.isPending}
              />
            </div>

            {forgotPassword.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {forgotPassword.error.message || 'Произошла ошибка. Попробуйте ещё раз.'}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={forgotPassword.isPending || !email}
            >
              {forgotPassword.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить инструкции'
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

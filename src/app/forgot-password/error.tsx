'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Forgot password page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Что-то пошло не так</CardTitle>
          <CardDescription>
            Произошла ошибка при загрузке страницы сброса пароля
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Пожалуйста, попробуйте обновить страницу или вернитесь позже.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Попробовать ещё раз
            </Button>
            
            <Link href="/auth">
              <Button variant="outline" className="w-full">
                Вернуться к входу
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

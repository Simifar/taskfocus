# 🚀 Полная инструкция по настройке Resend для TaskFocus

## 📋 Оглавление
1. [Регистрация на Resend](#регистрация-на-resend)
2. [Получение API ключа](#получение-api-ключа)
3. [Настройка домена](#настройка-домена)
4. [Настройка переменных окружения](#настройка-переменных-окружения)
5. [Тестирование](#тестирование)
6. [Тарифы и лимиты](#тарифы-и-лимиты)
7. [Troubleshooting](#troubleshooting)

---

## 🏁 Регистрация на Resend

### 1. Создание аккаунта
1. Перейдите на [https://resend.com](https://resend.com)
2. Нажмите **"Sign up"**
3. Выберите способ регистрации:
   - **GitHub** (рекомендуется)
   - **Google**
   - **Email**

### 2. Подтверждение email
- Если регистрировались через email, проверьте почту и подтвердите аккаунт
- Для GitHub/Google авторизация происходит мгновенно

---

## 🔑 Получение API ключа

### 1. Создание API ключа
1. В dashboard Resend нажмите **"API Keys"** в левом меню
2. Нажмите **"Create API Key"**
3. Введите название ключа, например: `taskfocus-production`
4. Выберите права доступа:
   - **Full Access** (для продакшена)
   - **Sending only** (только отправка)
5. Скопируйте ключ - он будет выглядеть как: `re_xxxxxxxxxxxxxxxxxxxxxxx`

> ⚠️ **Важно:** Сохраните API ключ в безопасном месте. После закрытия окна его нельзя будет увидеть снова.

### 2. Тестовый ключ
Для разработки можно создать ключ с правами **Sending only**:
```
re_test_xxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🌐 Настройка домена

### 1. Добавление домена
1. В dashboard перейдите в **"Domains"**
2. Нажмите **"Add Domain"**
3. Введите ваш домен:
   - Для разработки: `localhost` (автоматически)
   - Для продакшена: `yourdomain.com`

### 2. Верификация домена
После добавления домена Resend покажет DNS записи:

#### **TXT запись** (обязательно)
```
Type: TXT
Name: _dmarc.yourdomain.com
Value: v=DMARC1; p=none
```

#### **SPF запись** (обязательно)
```
Type: TXT
Name: yourdomain.com
Value: v=spf1 include:resend.com -all
```

#### **DKIM запись** (обязательно)
```
Type: TXT
Name: resend._domainkey.yourdomain.com
Value: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

### 3. Настройка DNS
1. Зайдите в панель управления вашего домена
2. Добавьте все 3 DNS записи
3. Подождите 5-60 минут для распространения DNS
4. В Resend нажмите **"Verify"**

> 💡 **Совет:** Для быстрого тестирования можно использовать **отправку с домена Resend** без настройки своего домена.

---

## ⚙️ Настройка переменных окружения

### 1. Локальная разработка (.env)
```env
# Email конфигурация
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="TaskFocus <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Продакшен (Vercel/Hosting)
1. В настройках проекта добавьте переменные окружения:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` 
   - `NEXT_PUBLIC_APP_URL`

### 3. Примеры EMAIL_FROM
```env
# Для домена yourdomain.com
EMAIL_FROM="TaskFocus <noreply@yourdomain.com>"

# Для тестирования с Resend домена
EMAIL_FROM="TaskFocus <onboarding@resend.dev>"
```

---

## 🧪 Тестирование

### 1. Тестовый email
Создайте файл `test-email.js`:
```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: ['your-email@gmail.com'],
      subject: 'Test Email from TaskFocus',
      html: '<h1>✅ Email работает!</h1><p>TaskFocus готов к отправке писем.</p>',
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Email sent:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();
```

Запустите тест:
```bash
node test-email.js
```

### 2. Тест через API
Используйте эндпоинт `/forgot-password` для тестирования:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

### 3. Проверка логов
В dashboard Resend:
1. Перейдите в **"Logs"**
2. Проверьте статус отправленных писем
3. Ищите ошибки или проблемы с доставкой

---

## 💰 Тарифы и лимиты

### Free Tier (бесплатно)
- **3000 писем/месяц**
- **100 писем/день**
- **1 домен**
- **Базовая аналитика**

### Pro Tier ($20/месяц)
- **50,000 писем/месяц**
- **1000 писем/день**
- **3 домена**
- **Расширенная аналитика**
- **Приоритетная поддержка**

### Для TaskFocus
Free tier достаточно для:
- Небольших проектов (<100 пользователей)
- Тестирования и разработки
- MVP версии

---

## 🔧 Troubleshooting

### ❌ Common Issues

#### 1. "Invalid API key"
```
Solution: Проверьте правильность API ключа в .env
```

#### 2. "Domain not verified"
```
Solution: Убедитесь что DNS записи добавлены и верифицированы
```

#### 3. "Rate limit exceeded"
```
Solution: Подождите до следующего дня или обновите тариф
```

#### 4. "Email not delivered"
```
Solution: Проверьте папку Спам, настройки SPF/DKIM
```

#### 5. "From address not authorized"
```
Solution: Убедитесь что EMAIL_FROM использует верифицированный домен
```

### 🐛 Debug режим

Добавьте логирование в `src/server/email.ts`:
```typescript
export async function sendPasswordResetEmail(email: string, token: string) {
  console.log('📧 Sending email to:', email);
  console.log('🔑 Using API key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: [email],
      // ... остальной код
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }
    
    console.log('✅ Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}
```

### 📱 Проверка доставки

1. **Dashboard Resend** → Logs
2. **Email headers** → Проверить SPF/DKIM/DMARC
3. **Google Postmaster** → Для Gmail
4. **Microsoft SNDS** → For Outlook/Hotmail

---

## 🚀 Альтернативы Resend

Если Resend не подходит:

### 1. **Nodemailer + Gmail**
```bash
npm install nodemailer
```
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});
```

### 2. **SendGrid**
```bash
npm install @sendgrid/mail
```

### 3. **AWS SES**
Бесплатно: 62,000 писем/месяц (для EC2)

---

## ✅ Checklist перед продакшеном

- [ ] API ключ добавлен в переменные окружения
- [ ] Домен верифицирован в Resend
- [ ] DNS записи настроены (SPF, DKIM, DMARC)
- [ ] EMAIL_FROM использует верифицированный домен
- [ ] NEXT_PUBLIC_APP_URL указывает на продакшен домен
- [ ] Тестовое письмо успешно отправлено
- [ ] Rate limiting настроен в API
- [ ] Логирование ошибок добавлено
- [ ] Проверено на разных email провайдерах

---

## 📞 Поддержка

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Status Page**: [https://resend.com/status](https://resend.com/status)
- **Support**: support@resend.com

---

## 🎉 Готово!

После выполнения этих шагов TaskFocus сможет отправлять письма для сброса пароля. Пользователи получат красивые email с инструкциями по восстановлению доступа к аккаунту.

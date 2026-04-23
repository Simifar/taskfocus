import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: [email],
      subject: 'TaskFocus - Сброс пароля',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">TaskFocus</h2>
          <h1>Сброс пароля</h1>
          
          <p>Здравствуйте!</p>
          <p>Вы получили это письмо, потому что кто-то (возможно, вы) запросил сброс пароля для вашего аккаунта TaskFocus.</p>
          
          <p>Если это были вы, нажмите на кнопку ниже, чтобы установить новый пароль:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold;">
              Сбросить пароль
            </a>
          </div>
          
          <p>Или скопируйте эту ссылку в браузер:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p><strong>Важно:</strong></p>
          <ul>
            <li>Эта ссылка действительна в течение 1 часа</li>
            <li>Если вы не запрашивали сброс пароля, проигнорируйте это письмо</li>
            <li>Никогда не делитесь этой ссылкой с другими</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            С уважением,<br>
            Команда TaskFocus
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

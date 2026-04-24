export default async function ResetPasswordRoute({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Redirect to old reset-password page for now
  // TODO: Implement i18n version
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        <p className="text-muted-foreground">This page is being migrated to the new i18n system.</p>
      </div>
    </div>
  );
}

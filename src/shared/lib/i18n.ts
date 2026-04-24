import { useTranslations } from 'next-intl';

// Helper hook for common translations
export function useCommonTranslations() {
  return useTranslations('common');
}

// Helper hook for navigation translations
export function useNavigationTranslations() {
  return useTranslations('navigation');
}

// Helper hook for dashboard translations
export function useDashboardTranslations() {
  return useTranslations('dashboard');
}

// Helper hook for task translations
export function useTaskTranslations() {
  return useTranslations('tasks');
}

// Helper hook for auth translations
export function useAuthTranslations() {
  return useTranslations('auth');
}

// Helper hook for profile translations
export function useProfileTranslations() {
  return useTranslations('profile');
}

// Helper hook for calendar translations
export function useCalendarTranslations() {
  return useTranslations('calendar');
}

// Helper hook for inbox translations
export function useInboxTranslations() {
  return useTranslations('inbox');
}

// Generic helper for nested translations
export function useTranslation(namespace: string) {
  return useTranslations(namespace);
}

// Helper for motivation quotes
export function useMotivationQuotes() {
  const t = useTranslations('motivation');
  return Array.isArray(t.raw) ? t.raw : [];
}

"use client";

import { NextIntlClientProvider } from "next-intl";

/**
 * next-intl context for useLocale() and the language switcher's navigation
 * hooks. Rendered from a Client Component on purpose: from a Server Component,
 * v4's provider tries to inherit an i18n/request.ts config that this app does
 * not have — its strings come from react-i18next, not next-intl messages.
 */
export default function IntlProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider locale={locale} timeZone="America/Chicago">
      {children}
    </NextIntlClientProvider>
  );
}

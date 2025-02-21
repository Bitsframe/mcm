import TranslationsProvider from "@/components/TranslationsProvider";
import ClientLayout from "@/app/[locale]/login/clientlayout";
import initTranslations from "@/app/i18n";

const i18nNamespaces = ['Login'];

export default async function Layout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  console.log('locale', locale);
  const { resources } = await initTranslations(locale, i18nNamespaces);
  console.log('resources', resources);
  return (
    <TranslationsProvider resources={resources} locale={locale} namespaces={i18nNamespaces}>
      <ClientLayout>{children}</ClientLayout>
    </TranslationsProvider>
  );
}
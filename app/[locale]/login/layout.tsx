import TranslationsProvider from "@/components/TranslationsProvider";
import ClientLayout from "@/app/[locale]/login/clientlayout";
import initTranslations from "@/app/i18n";

const i18nNamespaces = ['Login'];
interface LayoutProps {
  children: React.ReactNode;
  params: any;
}

export default async function Layout({
  children,
  params: { locale },
}: LayoutProps) {
  const { resources } = await initTranslations(locale, i18nNamespaces);
  return (
    <TranslationsProvider resources={resources} locale={locale} namespaces={i18nNamespaces}>
      <ClientLayout>{children}</ClientLayout>
    </TranslationsProvider>
  );
}
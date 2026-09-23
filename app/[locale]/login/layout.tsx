import TranslationsProvider from "@/components/TranslationsProvider";
import ClientLayout from "@/app/[locale]/login/clientlayout";
import initTranslations from "@/app/i18n";
import IntlProvider from "@/provider/IntlProvider";

const i18nNamespaces = ['Login'];
interface LayoutProps {
  children: React.ReactNode;
  params: any;
}

export default async function Layout({
  children,
  params,
}: LayoutProps) {
	const { locale } = await params

  const { resources } = await initTranslations(locale, i18nNamespaces);
  return (
    // next-intl v4 needs an explicit provider; see provider/IntlProvider.
    <IntlProvider locale={locale}>
      <TranslationsProvider resources={resources} locale={locale} namespaces={i18nNamespaces}>
        <ClientLayout>{children}</ClientLayout>
      </TranslationsProvider>
    </IntlProvider>
  );
}

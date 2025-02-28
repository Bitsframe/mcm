import RootLayoutComponent from "@/components/RootLayoutComponent";
import { ActiveTabProvider, AuthProvider, LocationProvider } from "@/context";
import initTranslations from "@/app/i18n";
import TranslationsProvider from "@/components/TranslationsProvider";
import { NextIntlClientProvider } from "next-intl";




const i18nNamespaces = ['Dashboard', 'Sidebar', 'Patients', 'Appoinments', 'Privatefeedback', 'Stockpanel', 'Rolesandper', 'POS-Sales', 'POS-Return', 'POS-History', 'EmailB', 'Inventory', 'Login', 'Procode', 'Usermanagement', 'WebCont'];




export default async function layout({
	children,
	params: { locale },
}: {
	children: React.ReactNode;
	params: any;
}) {
  const { resources } = await initTranslations(locale, i18nNamespaces);

	return (
		<div className="bg-gray-50">
			<ActiveTabProvider>
				<LocationProvider>
					<AuthProvider >
					<TranslationsProvider resources={resources} locale={locale} namespaces={i18nNamespaces}>
						<RootLayoutComponent >
							{children}
						</RootLayoutComponent>
							</TranslationsProvider>
					</AuthProvider>
				</LocationProvider>
			</ActiveTabProvider>
		</div>
	);
}

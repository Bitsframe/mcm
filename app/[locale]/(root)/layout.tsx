import RootLayoutComponent from "@/components/RootLayoutComponent";
import { ActiveTabProvider, AuthProvider, LocationProvider } from "@/context";
import initTranslations from "@/app/i18n";
import TranslationsProvider from "@/components/TranslationsProvider";



const i18nNamespaces = ['Dashboard', 'Sidebar', 'Patients', 'Appoinments', 'Privatefeedback', 'Stockpanel', 'Rolesandpermissions', 'POS-Sales', 'POS-Return', 'POS-History', 'EmailB', 'Inventory', 'Login', 'Procode', 'Usermanagement', 'WebCont'];




export default async function layout({
	children,
	params: { locale },
}: {
	children: React.ReactNode;
	params: { locale: string };
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

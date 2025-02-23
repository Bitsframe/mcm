import RootLayoutComponent from "@/components/RootLayoutComponent";
import { ActiveTabProvider, AuthProvider, LocationProvider } from "@/context";
import initTranslations from "@/app/i18n";
import TranslationsProvider from "@/components/TranslationsProvider";


const i18nNamespaces = ['Dashboard'];




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
						<RootLayoutComponent >
								<TranslationsProvider resources={resources} locale={locale} namespaces={i18nNamespaces}>
							
							{children}
							</TranslationsProvider>
						</RootLayoutComponent>
					</AuthProvider>
				</LocationProvider>
			</ActiveTabProvider>
		</div>
	);
}

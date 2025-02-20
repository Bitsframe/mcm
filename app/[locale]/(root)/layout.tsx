import RootLayoutComponent from "@/components/RootLayoutComponent";
import { ActiveTabProvider, AuthProvider, LocationProvider } from "@/context";




export default function layout({
	children,
}: {
	children: React.ReactNode;
}) {

	return (
		<div className="bg-gray-50">
			<ActiveTabProvider>
				<LocationProvider>
					<AuthProvider >
						<RootLayoutComponent >
							{children}
						</RootLayoutComponent>
					</AuthProvider>
				</LocationProvider>
			</ActiveTabProvider>
		</div>
	);
}

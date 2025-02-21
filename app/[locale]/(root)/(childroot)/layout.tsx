'use client'
import AccessDenied from "@/components/AccessDenied";
import withAuthorization from "@/hoc/withAuthorization";


function Layout({
	children,
	isAllowed
}: {
	children: React.ReactNode;
	isAllowed: boolean;
}) {
	return isAllowed ? children : <AccessDenied />
}



export default withAuthorization(Layout);
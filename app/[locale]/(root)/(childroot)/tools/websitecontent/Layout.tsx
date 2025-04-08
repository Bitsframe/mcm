import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface WebsiteContentLayoutProps {
	children: ReactNode;
}

const WebsiteContentLayout: React.FC<WebsiteContentLayoutProps> = ({
	children,
}) => {
	return (
		<div className="" >
			<div className="space-y-5 ">
				<TopTabs />
			</div>
			<main
				style={{ zIndex: 9999999}}
				className="min-h-[calc(83dvh)]  mt-5 w-full h-[100%] bg-[#f6f6f6]  font-[500] text-[20px] space-y-5 p-2 rounded-md"
			>
				<main>{children}</main>
			</main>
		</div>
	);
};

export default WebsiteContentLayout;

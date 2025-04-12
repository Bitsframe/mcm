import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface WebsiteContentLayoutProps {
	children: ReactNode;
}

const WebsiteContentLayout: React.FC<WebsiteContentLayoutProps> = ({
	children,
}) => {
	return (
		<div className="flex justify-center gap-5 mt-8 " >
			<div className="space-y-5 ">
				<TopTabs />
			</div>
			<main
				style={{ zIndex: 9999999}}
				className="min-h-[calc(83dvh)] w-full h-[100%] font-[500] text-[20px] space-y-5 rounded-md"
			>
				<main>{children}</main>
			</main>
		</div>
	);
};

export default WebsiteContentLayout;

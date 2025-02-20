import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface PosLayoutProps {
	children: ReactNode;
}

const PosLayout: React.FC<PosLayoutProps> = ({
	children,
}) => {
	return (
		<div className="" >
			<div className="space-y-5 mt-20 ">
				<TopTabs />
			</div>
			<main
				style={{ zIndex: 9999999}}
				className="h-[calc(80dvh)] mt-5 w-full bg-[#f6f6f6]  font-[500] text-[20px] space-y-5 p-2 rounded-md"
			>
				<main className="">{children}</main>
			</main>
		</div>
	);
};

export default PosLayout;

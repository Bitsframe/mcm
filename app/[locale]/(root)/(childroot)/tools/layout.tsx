import { ConfigProvider } from "antd";

export default function layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConfigProvider
            theme={{
                components: {
                    Switch: {
                        colorPrimary: "green",
                        colorPrimaryHover: "#05cd05",
                    },
                },
            }}
        >
            <div className="bg-gray-50">
            {children}
            </div>

        </ConfigProvider>
    );
}

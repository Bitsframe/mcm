import { ConfigProvider } from "antd";

/** antd takes the same tokens as globals.css so its few controls match. */
export default function layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#166534",
                    colorPrimaryHover: "#125229",
                    colorText: "#1D1D1F",
                    colorTextSecondary: "#6E6E73",
                    colorBorder: "#D9D9DE",
                    colorSplit: "#E5E5EA",
                    borderRadius: 8,
                    controlHeight: 32,
                    fontSize: 13,
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-inter), "Segoe UI", Roboto, sans-serif',
                },
                components: {
                    Switch: {
                        colorPrimary: "#166534",
                        colorPrimaryHover: "#125229",
                    },
                },
            }}
        >
            <div className="bg-white">
            {children}
            </div>

        </ConfigProvider>
    );
}

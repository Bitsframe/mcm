import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Check if i18n is already initialized to prevent re-initialization
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        sidebar: {
          dashboard: "Dashboard",
          settings: "Settings",
        },
      },
      es: {
        sidebar: {
          dashboard: "Panel",
          settings: "Configuración",
        },
      },
    },
    lng: "en", // Default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
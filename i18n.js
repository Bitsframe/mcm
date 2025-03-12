import i18n from "i18next";
import { initReactI18next } from "react-i18next";

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

export default i18n;
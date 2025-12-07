"use client";

import { I18nextProvider } from "react-i18next";
import initTranslations from "@/app/i18n";
import { createInstance } from "i18next";

import { useEffect, useState } from "react";

export default function TranslationsProvider({
  children,
  locale,
  namespaces,
  resources,
}) {
  const [i18nInstance, setI18nInstance] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const i18n = createInstance();
      try {
        const res = await initTranslations(locale, namespaces, i18n, resources);
        if (!mounted) return;
        setI18nInstance(res.i18n || i18n);
        setReady(true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error initializing translations:", err);
        if (!mounted) return;
        // still set instance so app can render with keys rather than crash
        setI18nInstance(i18n);
        setReady(true);
      }
    }

    setup();

    return () => {
      mounted = false;
    };
  }, [locale, namespaces, resources]);

  if (!ready || !i18nInstance) return null;

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}

import { createNavigation } from "next-intl/navigation";

export const locales = ["en", "es"];
export const localePrefix = "as-needed";

// next-intl v4 replaced createSharedPathnamesNavigation with createNavigation;
// the returned helpers are the same. Nothing imports this module today, but it
// is kept working rather than left pointing at an API that no longer exists.
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  localePrefix,
});

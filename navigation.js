import { createNavigation } from "next-intl/navigation";

export const locales = ["en", "es"];
export const defaultLocale = "en";
export const localePrefix = "as-needed";

// next-intl v4 replaced createSharedPathnamesNavigation with createNavigation;
// the returned helpers are the same. With `as-needed`, v4 needs to know which
// locale is the unprefixed one. The language switchers in components/ import
// useRouter / usePathname from here to change locale without losing the path.
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
  localePrefix,
});

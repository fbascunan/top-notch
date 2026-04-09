import es from "./es.json";
import en from "./en.json";

export type Locale = "es" | "en";
export const defaultLocale: Locale = "es";
export const locales: Locale[] = ["es", "en"];

const translations: Record<Locale, typeof es> = { es, en };

/**
 * Get a translated string by dot-notation key.
 * Example: t("es", "nav.services") → "Servicios"
 */
export function t(locale: Locale | undefined, key: string): string {
  const lang = locale ?? defaultLocale;
  const keys = key.split(".");
  let result: unknown = translations[lang];
  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      // Fallback to default locale
      result = translations[defaultLocale];
      for (const fk of keys) {
        if (result && typeof result === "object" && fk in result) {
          result = (result as Record<string, unknown>)[fk];
        } else {
          return key;
        }
      }
      return typeof result === "string" ? result : key;
    }
  }
  return typeof result === "string" ? result : key;
}

/**
 * Get a translated array by dot-notation key.
 * Example: tArray("es", "services.items") → [{title, description}, ...]
 */
export function tArray<T = unknown>(locale: Locale | undefined, key: string): T[] {
  const lang = locale ?? defaultLocale;
  const keys = key.split(".");
  let result: unknown = translations[lang];
  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return [];
    }
  }
  return Array.isArray(result) ? (result as T[]) : [];
}

/**
 * Get the locale from the current URL pathname.
 */
export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith("/en/") || pathname === "/en") {
    return "en";
  }
  return "es";
}

/**
 * Get the path prefix for a locale.
 */
export function getLocalePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/**
 * Convert a path from one locale to another.
 * e.g., "/en/services" → "/services" (to Spanish)
 * e.g., "/services" → "/en/services" (to English)
 */
export function getLocalizedPath(path: string, targetLocale: Locale): string {
  // Strip existing locale prefix
  let cleanPath = path;
  if (cleanPath.startsWith("/en/")) {
    cleanPath = cleanPath.slice(3);
  } else if (cleanPath === "/en") {
    cleanPath = "/";
  }

  if (targetLocale === defaultLocale) {
    return cleanPath || "/";
  }

  return `/${targetLocale}${cleanPath === "/" ? "" : cleanPath}` || `/${targetLocale}`;
}

/**
 * Get the alternate URL for SEO hreflang tags.
 */
export function getAlternateUrls(currentPath: string, site: string): { locale: Locale; url: string }[] {
  return locales.map((locale) => ({
    locale,
    url: `${site}${getLocalizedPath(currentPath, locale)}`,
  }));
}

/**
 * Date locale strings for toLocaleDateString.
 */
export function getDateLocale(locale: Locale): string {
  return locale === "es" ? "es-CL" : "en-US";
}

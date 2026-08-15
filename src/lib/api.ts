export const isStatic = import.meta.env.VITE_STATIC === "true";

export function apiUrl(path: string): string {
  if (import.meta.env.VITE_STATIC === "true") {
    const siteBase = import.meta.env.BASE_URL.replace(/\/$/, "");
    const [pathname, query] = path.split("?");
    const joined = `${siteBase}${pathname}.json`;
    return query ? `${joined}?${query}` : joined;
  }
  return path;
}

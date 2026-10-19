/** Normalises a host or URL ("my-site.vercel.app", "https://x.com/") to an origin, or "" if invalid. */
function toOrigin(value: string | undefined) {
  const v = value?.trim();
  if (!v) return "";
  try {
    return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).origin;
  } catch {
    return "";
  }
}

/** The configured public site URL (NEXT_PUBLIC_SITE_URL), normalised. Empty when unset. */
export function configuredSiteUrl() {
  return toOrigin(process.env.NEXT_PUBLIC_SITE_URL);
}

/** Best-known public origin: NEXT_PUBLIC_SITE_URL, then Vercel's production / deployment URL, then localhost. */
export function siteUrl() {
  return (
    configuredSiteUrl() ||
    toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    toOrigin(process.env.VERCEL_URL) ||
    "http://localhost:3000"
  );
}

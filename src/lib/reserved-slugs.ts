const RESERVED = new Set([
  "api",
  "login",
  "register",
  "logout",
  "dashboard",
  "admin",
  "onboarding",
  "forgot-password",
  "reset-password",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function isReservedSlug(slug: string) {
  return RESERVED.has(slug.toLowerCase());
}

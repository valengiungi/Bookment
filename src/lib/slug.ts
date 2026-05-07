import { prisma } from "@/lib/prisma";
import { isReservedSlug } from "@/lib/reserved-slugs";

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function ensureUniqueTenantSlug(base: string) {
  let slug = base || "negocio";
  if (!slug || isReservedSlug(slug)) {
    slug = `${slug || "negocio"}-1`;
  }
  let candidate = slug;
  let n = 1;
  while (isReservedSlug(candidate) || (await prisma.tenant.findUnique({ where: { slug: candidate } }))) {
    n += 1;
    candidate = `${slug}-${n}`;
  }
  return candidate;
}

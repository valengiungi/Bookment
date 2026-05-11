import Image from "next/image";

const BRAND_LOGO_SRC = "/brand/bookment-logo.png";
const LOGO_W = 1024;
const LOGO_H = 682;

type BookmentLogoProps = {
  /** Lockup: imagen glass + nombre. Mark: solo imagen compacta. */
  variant?: "lockup" | "mark";
  className?: string;
};

/**
 * Logo oficial (PNG glass + B / calendario / tilde).
 * Archivo: `public/brand/bookment-logo.png`
 */
export function BookmentLogo({ variant = "lockup", className }: BookmentLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src={BRAND_LOGO_SRC}
        alt=""
        width={LOGO_W}
        height={LOGO_H}
        className={["h-9 w-auto max-w-[3rem] object-contain object-left", className].filter(Boolean).join(" ")}
        sizes="48px"
        aria-hidden
      />
    );
  }

  return (
    <span className={["inline-flex items-center gap-2.5", className].filter(Boolean).join(" ")}>
      <Image
        src={BRAND_LOGO_SRC}
        alt=""
        width={LOGO_W}
        height={LOGO_H}
        className="h-8 w-auto max-h-9 object-contain object-left sm:h-9 sm:max-h-10"
        sizes="(max-width: 640px) 140px, 180px"
        priority
        aria-hidden
      />
      <span className="select-none text-lg font-semibold tracking-tight sm:text-xl" aria-hidden>
        <span className="text-teal-600">Book</span>
        <span className="text-slate-900">ment</span>
      </span>
    </span>
  );
}

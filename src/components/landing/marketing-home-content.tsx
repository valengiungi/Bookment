"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

/** Antes / ahora: tono profesional; detalle de Excel y avisos alineado al producto. */
const frictionRows: [string, string][] = [
  [
    "Reservas que se pierden en la coordinación por canales de mensajería.",
    "Página pública con horarios reales: tus clientes reservan con claridad, sin depender de tu respuesta inmediata.",
  ],
  [
    "Tiempo operativo consumido en consultas repetitivas de disponibilidad.",
    "El cliente elige servicio, profesional y horario en un solo lugar.",
  ],
  [
    "Errores cotidianos en agendas manuales: cruces de horario, huecos o anotaciones descoordinadas.",
    "Agenda profesional sin doble reserva y alineada con bloqueos y reglas de atención.",
  ],
  [
    "Cierre de mes con información dispersa entre planillas y archivos sueltos.",
    "Historial con totales y promedios en el mismo panel; exportación a Excel con turnos, gastos y balance para presentar o archivar.",
  ],
  [
    "Enterarte de una confirmación nueva con demora.",
    "Aviso al negocio por WhatsApp cuando alguien confirma una reserva desde tu link público.",
  ],
];

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

type BillingCycle = "monthly" | "annual";

type PricingData = {
  simpleMonthlyArs: number;
  premiumMonthlyArs: number;
  simpleAnnualArs: number;
  premiumAnnualArs: number;
};

function formatArs(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-AR")}`;
}

function formatPercentOff(monthlyArs: number, annualArs: number): string | null {
  const baseAnnual = monthlyArs * 12;
  if (baseAnnual <= annualArs) return null;
  const pct = Math.round(((baseAnnual - annualArs) / baseAnnual) * 100);
  return `${pct}% off`;
}

function PricingCard({
  name,
  description,
  featured = false,
  billingCycle,
  monthlyArs,
  annualArs,
  items,
}: {
  name: string;
  description: string;
  featured?: boolean;
  billingCycle: BillingCycle;
  monthlyArs: number;
  annualArs: number;
  items: string[];
}) {
  const isAnnual = billingCycle === "annual";
  const priceArs = isAnnual ? annualArs : monthlyArs;
  const yearlySaving = monthlyArs * 12 - annualArs;
  const percentOff = formatPercentOff(monthlyArs, annualArs);

  return (
    <div
      className={
        featured
          ? "rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-6 shadow-sm"
          : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      }
    >
      {featured ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Más vendido</p>
      ) : null}
      <h3 className={featured ? "mt-1 text-lg font-semibold text-slate-900" : "text-lg font-semibold text-slate-900"}>
        {name}
      </h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">
        {formatArs(priceArs)}{" "}
        <span className="text-base font-normal text-slate-500">
          / {isAnnual ? "año" : "mes"}
        </span>
      </p>
      {isAnnual ? (
        <div className="mt-2 space-y-1">
          <p className="text-sm font-medium text-slate-700">
            Equivale a {formatArs(priceArs / 12)} por mes.
          </p>
          {yearlySaving > 0 ? (
            <p className="text-sm text-teal-700">
              Ahorrás {formatArs(yearlySaving)} al pagar anual
              {percentOff ? ` (${percentOff})` : ""}.
            </p>
          ) : (
            <p className="text-sm text-slate-500">Pago anticipado anual.</p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Facturación mensual.</p>
      )}
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function RevealSection({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  /** Solo opacidad: el translateY en bloques grandes suele sentirse como “traba” al scrollear. */
  return (
    <m.section
      className={className}
      initial={{ opacity: reduce ? 1 : 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px", amount: 0.05 }}
      transition={{ duration: reduce ? 0 : 0.38, ease: easeOut }}
    >
      {children}
    </m.section>
  );
}

export function MarketingHomeContent({
  pricing,
}: {
  pricing: PricingData;
}) {
  const reduce = useReducedMotion();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const heroContainer = {
    hidden: {},
    show: {
      transition: reduce
        ? {}
        : {
            staggerChildren: 0.1,
            delayChildren: 0.06,
          },
    },
  };

  const heroItem = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.45, ease: easeOut },
    },
  };

  const staggerWrap = {
    hidden: {},
    show: {
      transition: reduce ? {} : { staggerChildren: 0.09, delayChildren: 0.04 },
    },
  };

  const staggerCard = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.4, ease: easeOut },
    },
  };

  const faqStagger = {
    hidden: {},
    show: {
      transition: reduce ? {} : { staggerChildren: 0.07, delayChildren: 0.05 },
    },
  };

  const faqItem = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.36, ease: easeOut },
    },
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <>
        <main className="flex-1 overflow-x-clip">
          <m.section className="relative mx-auto max-w-6xl px-4 pt-12 pb-5 sm:px-6 sm:pt-16 sm:pb-6">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            >
              <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-teal-100/40 blur-3xl" />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            >
              <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-slate-200/50 blur-3xl" />
            </div>

            <div className="mx-auto max-w-2xl text-center">
              <m.div
                variants={heroContainer}
                initial="hidden"
                animate="show"
                className="relative"
              >
                <m.h1
                  variants={heroItem}
                  className="text-4xl font-medium tracking-tight text-teal-600 sm:text-5xl"
                >
                  Automatizá tus reservas
                </m.h1>
                <m.p
                  variants={heroItem}
                  className="mt-4 text-lg leading-relaxed text-slate-600"
                >
                  Un solo link para que tus clientes elijan servicio, profesional y horario. Vos
                  concentrás en atender, no en coordinar mensajes.
                </m.p>
                <m.div
                  variants={heroItem}
                  className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center"
                >
                  <m.div
                    className="sm:inline-flex"
                    whileHover={reduce ? undefined : { scale: 1.02 }}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  >
                    <Link
                      href="/register"
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-600 px-6 text-base font-semibold text-white shadow-sm hover:bg-teal-700 sm:w-auto"
                    >
                      Creá tu agenda online
                    </Link>
                  </m.div>
                  <m.div
                    className="sm:inline-flex"
                    whileHover={reduce ? undefined : { scale: 1.02 }}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  >
                    <Link
                      href="/login"
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto"
                    >
                      Ya tengo cuenta
                    </Link>
                  </m.div>
                </m.div>
              </m.div>
            </div>
          </m.section>

          <RevealSection className="border-y border-slate-200 bg-white pt-[3.5cm] pb-14 sm:pb-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="text-center text-2xl font-semibold text-slate-900">
                Cómo era antes y cómo es ahora
              </h2>
              <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3.5 font-semibold text-slate-900 sm:px-6">
                          Cómo era antes
                        </th>
                        <th className="px-4 py-3.5 font-semibold text-teal-800 sm:px-6">
                          Cómo es con Bookment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {frictionRows.map(([before, after], i) => (
                        <tr
                          key={before}
                          className={
                            i % 2 === 0
                              ? "border-b border-slate-100 bg-white"
                              : "border-b border-slate-100 bg-slate-50/60"
                          }
                        >
                          <td className="px-4 py-3.5 align-top text-slate-700 sm:px-6 sm:py-4">
                            {before}
                          </td>
                          <td className="px-4 py-3.5 align-top text-slate-800 sm:px-6 sm:py-4">
                            <span className="font-medium text-slate-900">{after}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection className="py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="text-center text-2xl font-semibold text-slate-900">
                Cómo funciona
              </h2>
              <m.ol
                className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
                variants={staggerWrap}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "0px 0px -72px 0px", amount: 0.08 }}
              >
                {[
                  ["1", "Creá tu cuenta", "Registro simple en minutos."],
                  ["2", "Configurá tu negocio", "Servicios, horarios y equipo."],
                  ["3", "Compartí tu link", "Una URL con tu marca."],
                  ["4", "Recibí reservas", "Confirmación clara para vos y el cliente."],
                ].map(([n, title, desc]) => (
                  <m.li
                    key={title}
                    variants={staggerCard}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                      {n}
                    </span>
                    <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                  </m.li>
                ))}
              </m.ol>
            </div>
          </RevealSection>

          <section className="py-16 sm:py-20">
            <m.div
              className="mx-auto max-w-6xl px-4 sm:px-6"
              variants={staggerWrap}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "0px 0px -72px 0px", amount: 0.08 }}
            >
              <m.h2
                variants={staggerCard}
                className="text-center text-2xl font-semibold text-slate-900"
              >
                Precios
              </m.h2>
              <m.p
                variants={staggerCard}
                className="mx-auto mt-3 max-w-xl text-center text-slate-600"
              >
                Dos planes claros. Los montos se pueden ajustar según tu mercado; al registrarte te
                asignan el plan que acuerdes con quien opera Bookment.
              </m.p>
              <m.div variants={staggerCard} className="mx-auto mt-8 max-w-4xl">
                <div className="rounded-[1.4rem] border-[3px] border-slate-800 bg-slate-800 p-1.5 shadow-sm">
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      ["monthly", "Mensual"],
                      ["annual", "Anual"],
                    ] as const).map(([value, label]) => {
                      const active = billingCycle === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setBillingCycle(value)}
                          className={
                            active
                              ? "rounded-[1.1rem] bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm"
                              : "rounded-[1.1rem] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/60"
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-3 text-center text-sm text-slate-500">
                  Anual: pago anticipado con mejor precio.
                </p>
              </m.div>
              <div className="mx-auto mt-8 grid max-w-3xl gap-6 md:grid-cols-2">
                <m.div variants={staggerCard} className="min-w-0">
                  <PricingCard
                    name="Simple"
                    description="Para negocios que arrancan o con agenda acotada."
                    billingCycle={billingCycle}
                    monthlyArs={pricing.simpleMonthlyArs}
                    annualArs={pricing.simpleAnnualArs}
                    items={[
                      "Link público y reservas sin choques de horario",
                      "Cupo limitado: hasta 3 servicios y 2 profesionales",
                      "Límite mensual de turnos confirmados",
                      "Panel para agenda, bloqueos y clientes",
                      "Sin aviso por WhatsApp al negocio: el turno queda en la agenda y lo ves al entrar",
                    ]}
                  />
                </m.div>
                <m.div variants={staggerCard} className="min-w-0">
                  <PricingCard
                    name="Premium"
                    description="Cuando la agenda crece y necesitás datos."
                    featured
                    billingCycle={billingCycle}
                    monthlyArs={pricing.premiumMonthlyArs}
                    annualArs={pricing.premiumAnnualArs}
                    items={[
                      "Sin tope de turnos, servicios ni tamaño de equipo",
                      "Métricas de plata estimada y ranking de clientes en tu historial",
                      "Descargá tus reservas en un archivo para Excel o planillas (turnos confirmados)",
                      "Aviso por WhatsApp al negocio cuando alguien reserva por el link público",
                    ]}
                  />
                </m.div>
              </div>
            </m.div>
          </section>

          <RevealSection className="border-t border-slate-200 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              <h2 className="text-center text-2xl font-semibold text-slate-900">
                Preguntas frecuentes
              </h2>
              <m.dl
                className="mt-10 space-y-6"
                variants={faqStagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "0px 0px -72px 0px", amount: 0.08 }}
              >
                {[
                  [
                    "¿Puedo empezar rápido sin configurar todo de una?",
                    "Sí. Podés cargar lo básico (servicios, horarios y al menos un profesional) y compartir tu link el mismo día. Después ajustás detalles desde el panel.",
                  ],
                  [
                    "¿Cómo evita errores en la agenda?",
                    "La disponibilidad se calcula con tus horarios y bloqueos activos. Si un horario ya está tomado, no vuelve a ofrecerse para reservar.",
                  ],
                  [
                    "¿Qué información puedo revisar para cerrar el mes?",
                    "En Historial ves turnos, totales y promedios, y podés exportar un archivo de trabajo con el detalle de reservas y balance para análisis administrativo.",
                  ],
                  [
                    "¿Cómo me entero cuando entra una reserva nueva?",
                    "Cuando está habilitado, el sistema envía aviso por WhatsApp al negocio al momento de la confirmación para que no se te pase ninguna reserva.",
                  ],
                ].map(([q, a]) => (
                  <m.div
                    key={q}
                    variants={faqItem}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
                  >
                    <dt className="font-semibold text-slate-900">{q}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-slate-600">{a}</dd>
                  </m.div>
                ))}
              </m.dl>
            </div>
          </RevealSection>

          <RevealSection className="py-16 sm:py-20">
            <m.div
              className="mx-auto max-w-3xl rounded-3xl bg-teal-700 px-6 py-12 text-center text-white sm:px-10"
              initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px", amount: 0.1 }}
              transition={{ duration: reduce ? 0 : 0.42, ease: easeOut }}
            >
              <h2 className="text-2xl font-semibold sm:text-3xl">Listo para ordenar tu agenda</h2>
              <p className="mt-3 text-teal-100">
                Un producto repetible para escalar: una landing, un sistema, muchos clientes.
              </p>
              <m.div
                className="mt-8 inline-flex"
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
              >
                <Link
                  href="/register"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-base font-semibold text-teal-800 hover:bg-teal-50"
                >
                  Creá tu agenda online
                </Link>
              </m.div>
            </m.div>
          </RevealSection>
        </main>

        <m.footer
          className="border-t border-slate-200 py-8 text-center text-sm text-slate-500"
          initial={{ opacity: reduce ? 1 : 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -48px 0px", amount: 0.2 }}
          transition={{ duration: reduce ? 0 : 0.35, ease: easeOut }}
        >
          © {new Date().getFullYear()} Bookment
        </m.footer>
      </>
    </LazyMotion>
  );
}

import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { getConfiguredListPrices } from "@/lib/platform-pricing";
import { formatArs } from "@/lib/subscription-pricing";

async function PricingCards() {
  const { simple, premium } = await getConfiguredListPrices();
  return (
    <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Simple</h3>
        <p className="mt-1 text-sm text-slate-600">Para negocios que arrancan o con agenda acotada.</p>
        <p className="mt-3 text-3xl font-bold text-slate-900">
          {formatArs(simple)}{" "}
          <span className="text-base font-normal text-slate-500">/ mes</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Link público y reservas sin choques de horario</li>
          <li>• Cupo limitado: hasta 3 servicios y 2 profesionales</li>
          <li>• Límite mensual de turnos confirmados</li>
          <li>• Panel para agenda, bloqueos y clientes</li>
          <li>• Sin aviso por WhatsApp al negocio: el turno queda en la agenda y lo ves al entrar</li>
        </ul>
      </div>
      <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Más vendido</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">Premium</h3>
        <p className="mt-1 text-sm text-slate-600">Cuando la agenda crece y necesitás datos.</p>
        <p className="mt-3 text-3xl font-bold text-slate-900">
          {formatArs(premium)}{" "}
          <span className="text-base font-normal text-slate-500">/ mes</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Sin tope de turnos, servicios ni tamaño de equipo</li>
          <li>• Métricas de plata estimada y ranking de clientes en tu historial</li>
          <li>
            • Descargá tus reservas en un archivo para Excel o planillas (turnos confirmados)
          </li>
          <li>• Aviso por WhatsApp al negocio cuando alguien reserva por el link público</li>
        </ul>
      </div>
    </div>
  );
}

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
    "Historial con totales y promedios en el mismo panel; exportación a Excel con turnos y balance para presentar o archivar.",
  ],
  [
    "Enterarte de una confirmación nueva con demora.",
    "Aviso al negocio por WhatsApp cuando alguien confirma una reserva desde tu link público.",
  ],
];

export default async function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-medium tracking-tight text-teal-600 sm:text-5xl">
              Automatizá tus reservas
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Un solo link para que tus clientes elijan servicio, profesional y horario. Vos
              concentrás en atender, no en coordinar mensajes.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-600 px-6 text-base font-semibold text-white shadow-sm hover:bg-teal-700"
              >
                Creá tu agenda online
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-800 hover:bg-slate-50"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-slate-900">
              Cómo era antes y cómo es ahora
            </h2>
            <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
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
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-slate-900">
              Cómo funciona
            </h2>
            <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["1", "Creá tu cuenta", "Registro simple en minutos."],
                ["2", "Configurá tu negocio", "Servicios, horarios y equipo."],
                ["3", "Compartí tu link", "Una URL con tu marca."],
                ["4", "Recibí reservas", "Confirmación clara para vos y el cliente."],
              ].map(([n, title, desc]) => (
                <li
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                    {n}
                  </span>
                  <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-slate-900">Precios</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
              Dos planes claros. Los montos se pueden ajustar según tu mercado; al registrarte te
              asignan el plan que acuerdes con quien opera Bookment.
            </p>
            <PricingCards />
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-slate-900">Preguntas frecuentes</h2>
            <dl className="mt-10 space-y-6">
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
                <div key={q} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <dt className="font-semibold text-slate-900">{q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-600">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl rounded-3xl bg-teal-700 px-6 py-12 text-center text-white sm:px-10">
            <h2 className="text-2xl font-semibold sm:text-3xl">Listo para ordenar tu agenda</h2>
            <p className="mt-3 text-teal-100">
              Un producto repetible para escalar: una landing, un sistema, muchos clientes.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-base font-semibold text-teal-800 hover:bg-teal-50"
            >
              Creá tu agenda online
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Bookment
      </footer>
    </div>
  );
}

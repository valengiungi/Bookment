import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";

const industries = [
  "Belleza y estética",
  "Salud y bienestar",
  "Legal y consultoría",
  "Fitness y coaching",
  "Tatuajes y arte",
  "Educación y terapias",
  "Servicios técnicos",
  "Cualquier agenda por turnos",
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              Reservas sin fricción
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
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
              Problemas que dejás atrás
            </h2>
            <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
              {[
                "Pérdida de turnos por demoras al responder",
                "Mensajes manuales que repiten lo mismo todo el día",
                "Desorganización entre equipo y distintos canales",
                "Cancelaciones de último momento sin aviso",
              ].map((t) => (
                <li
                  key={t}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 text-slate-700"
                >
                  <span className="mt-0.5 text-teal-600">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
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

        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-slate-900">
              Rubros compatibles
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              El mismo producto para negocios que viven de la agenda. Sin verticales rígidos: vos
              definís servicios y disponibilidad.
            </p>
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
              {industries.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-slate-900">Precios</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
              Lanzamiento con plan gratuito para validar tu operación. Pagos y planes premium
              llegan pronto sin cambiar de plataforma.
            </p>
            <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  $0 <span className="text-base font-normal text-slate-500">/ mes</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>• Perfil público y link propio</li>
                  <li>• Reservas con validación de agenda</li>
                  <li>• Multi-profesionales</li>
                  <li>• Panel mobile-first</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">Próximamente</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>• Recordatorios automáticos (24h)</li>
                  <li>• Pagos online</li>
                  <li>• Planes y límites por tenant</li>
                  <li>• Métricas avanzadas</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-slate-900">Preguntas frecuentes</h2>
            <dl className="mt-10 space-y-6">
              {[
                [
                  "¿Sirve para mi rubro?",
                  "Sí. Si trabajás con turnos y servicios con duración, podés configurarlo. No es un sistema médico ni un ERP: está enfocado en reservas.",
                ],
                [
                  "¿Cada negocio tiene su propia página?",
                  "Cada cliente obtiene un link público tipo tudominio.com/su-marca para que sus pacientes o clientes reserven solos.",
                ],
                [
                  "¿Puedo tener varios profesionales?",
                  "Cada miembro del equipo tiene su agenda. Los clientes eligen quién los atiende cuando corresponde.",
                ],
                [
                  "¿Qué pasa con los choques de horario?",
                  "El sistema evita doble reserva, respeta bloqueos, feriados o vacaciones que cargues, y horarios fuera de atención.",
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

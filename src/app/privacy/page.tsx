import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

const CONTACT_EMAIL = "giungivalen@gmail.com";

export const metadata: Metadata = {
  title: "Política de privacidad | Bookment",
  description: "Información sobre cómo Bookment recopila, usa y protege datos personales.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Política de privacidad"
      description="Esta política explica qué datos procesa Bookment, para qué los usa y cómo podés contactarte para ejercer tus derechos."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">1. Qué hace Bookment</h2>
        <p>
          Bookment es una plataforma para gestionar agendas, reservas online, profesionales,
          clientes y comunicaciones operativas vinculadas a turnos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">2. Qué datos podemos procesar</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Datos de acceso del negocio, como nombre, email y contraseña cifrada.</li>
          <li>Datos de configuración del negocio, como horarios, servicios y profesionales.</li>
          <li>Datos de clientes y turnos, como nombre, teléfono, email y horario reservado.</li>
          <li>Datos de uso técnico y seguridad necesarios para operar la plataforma.</li>
          <li>Datos de WhatsApp cuando el negocio habilita funciones vinculadas a ese canal.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">3. Para qué usamos los datos</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Brindar acceso al panel y a la página pública de reservas.</li>
          <li>Gestionar turnos, agenda, historial, gastos y reportes del negocio.</li>
          <li>Enviar o procesar avisos operativos cuando el negocio habilita esa función.</li>
          <li>Prevenir abuso, fraudes, errores técnicos y accesos no autorizados.</li>
          <li>Responder consultas de soporte y solicitudes administrativas.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">4. Con quién se comparten</h2>
        <p>
          Bookment solo comparte datos con proveedores de infraestructura y servicios necesarios
          para operar la plataforma, por ejemplo hosting, base de datos, autenticación o canales
          de mensajería integrados por el negocio. No vendemos datos personales.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">5. Conservación y seguridad</h2>
        <p>
          Conservamos la información mientras la cuenta esté activa o mientras sea necesaria para
          prestar el servicio, cumplir obligaciones legales o resolver incidencias. Aplicamos
          medidas técnicas y organizativas razonables para proteger la información.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">6. Tus derechos</h2>
        <p>
          Podés solicitar acceso, rectificación o eliminación de datos escribiendo a{" "}
          <a className="font-medium text-teal-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">7. Contacto</h2>
        <p>
          Para consultas sobre privacidad o tratamiento de datos, escribinos a{" "}
          <a className="font-medium text-teal-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}

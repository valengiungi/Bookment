import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

const CONTACT_EMAIL = "giungivalen@gmail.com";

export const metadata: Metadata = {
  title: "Condiciones del servicio | Bookment",
  description: "Condiciones generales de uso de la plataforma Bookment.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Condiciones del servicio"
      description="Estas condiciones describen el uso general de Bookment como plataforma de gestión de reservas y agenda."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">1. Objeto del servicio</h2>
        <p>
          Bookment ofrece una plataforma digital para administrar reservas, agenda, profesionales,
          servicios, clientes y herramientas relacionadas con la operación del negocio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">2. Uso permitido</h2>
        <p>El usuario se compromete a utilizar la plataforma de forma lícita y responsable.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>No utilizar Bookment para actividades ilegales, engañosas o abusivas.</li>
          <li>No cargar información falsa o de terceros sin autorización.</li>
          <li>No intentar vulnerar la seguridad, disponibilidad o integridad del sistema.</li>
          <li>No usar integraciones o mensajería para spam o comunicaciones no autorizadas.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">3. Responsabilidad del negocio</h2>
        <p>
          Cada negocio es responsable por la información que carga, por sus políticas comerciales y
          por la relación con sus clientes. Bookment provee la herramienta, pero no interviene en
          acuerdos, cancelaciones, cobros o prestaciones del negocio frente a terceros.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">4. Disponibilidad y cambios</h2>
        <p>
          Bookment puede actualizar, mejorar o ajustar funcionalidades, planes y límites operativos
          para mantener la plataforma, corregir errores o incorporar mejoras. Intentaremos que esos
          cambios sean razonables y compatibles con el uso normal del servicio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">5. Suspensión o baja</h2>
        <p>
          Bookment podrá limitar, suspender o finalizar el acceso en casos de uso abusivo,
          incumplimiento de estas condiciones, falta de pago o riesgo operativo o de seguridad.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">6. Propiedad intelectual</h2>
        <p>
          El software, diseño, contenidos y marcas de Bookment pertenecen a sus titulares. El uso
          del servicio no implica cesión de propiedad intelectual.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">7. Contacto</h2>
        <p>
          Para consultas sobre estas condiciones, escribinos a{" "}
          <a className="font-medium text-teal-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}

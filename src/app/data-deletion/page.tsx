import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

const CONTACT_EMAIL = "giungivalen@gmail.com";

export const metadata: Metadata = {
  title: "Eliminación de datos | Bookment",
  description: "Instrucciones para solicitar la eliminación de datos asociados a Bookment.",
};

export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <LegalPageShell
      title="Eliminación de datos"
      description="Si querés solicitar la eliminación de datos asociados a Bookment, seguí estas instrucciones."
    >
      {code ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <h2 className="text-lg font-semibold text-emerald-950">Solicitud registrada</h2>
          <p className="mt-2 text-sm text-emerald-900">
            Tu solicitud quedó registrada con el código <strong>{code}</strong>. Guardalo para
            futuras consultas sobre el estado del pedido.
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">1. Cómo pedir la eliminación</h2>
        <p>
          Enviá un email a{" "}
          <a className="font-medium text-teal-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          con el asunto <strong>Eliminación de datos Bookment</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">2. Qué información incluir</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Nombre del negocio o barbería.</li>
          <li>Email de la cuenta asociada.</li>
          <li>Número de WhatsApp vinculado, si corresponde.</li>
          <li>Descripción breve de lo que querés eliminar.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">3. Qué pasa después</h2>
        <p>
          Revisaremos la solicitud y podremos pedir información adicional para validar identidad o
          titularidad de la cuenta. Una vez confirmada, procesaremos la eliminación o te indicaremos
          si existe alguna obligación legal o técnica que requiera conservar parte de la información
          por un plazo determinado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">4. Eliminación desde el panel</h2>
        <p>
          Si sos titular del negocio y tenés acceso al panel, algunas bajas también pueden
          gestionarse desde la configuración de la cuenta. Si necesitás una eliminación total o
          asistencia, escribinos al email indicado arriba.
        </p>
      </section>
    </LegalPageShell>
  );
}

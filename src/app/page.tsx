import { MarketingHomeContent } from "@/components/landing/marketing-home-content";
import { MarketingHeader } from "@/components/marketing-header";
import { getConfiguredListPrices } from "@/lib/platform-pricing";
import { formatArs } from "@/lib/subscription-pricing";

function PricingSimpleCard({ priceArs }: { priceArs: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Simple</h3>
      <p className="mt-1 text-sm text-slate-600">Para negocios que arrancan o con agenda acotada.</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">
        {priceArs} <span className="text-base font-normal text-slate-500">/ mes</span>
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li>• Link público y reservas sin choques de horario</li>
        <li>• Cupo limitado: hasta 3 servicios y 2 profesionales</li>
        <li>• Límite mensual de turnos confirmados</li>
        <li>• Panel para agenda, bloqueos y clientes</li>
        <li>• Sin aviso por WhatsApp al negocio: el turno queda en la agenda y lo ves al entrar</li>
      </ul>
    </div>
  );
}

function PricingPremiumCard({ priceArs }: { priceArs: string }) {
  return (
    <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Más vendido</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900">Premium</h3>
      <p className="mt-1 text-sm text-slate-600">Cuando la agenda crece y necesitás datos.</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">
        {priceArs} <span className="text-base font-normal text-slate-500">/ mes</span>
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
  );
}

export default async function HomePage() {
  const { simple, premium } = await getConfiguredListPrices();

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <MarketingHomeContent
        pricingSimple={<PricingSimpleCard priceArs={formatArs(simple)} />}
        pricingPremium={<PricingPremiumCard priceArs={formatArs(premium)} />}
      />
    </div>
  );
}

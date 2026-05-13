import { MarketingHomeContent } from "@/components/landing/marketing-home-content";
import { MarketingHeader } from "@/components/marketing-header";
import { getConfiguredListPrices } from "@/lib/platform-pricing";

export default async function HomePage() {
  const { simple, premium } = await getConfiguredListPrices();

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <MarketingHomeContent
        pricing={{
          simpleMonthlyArs: simple,
          premiumMonthlyArs: premium,
          simpleAnnualArs: 250_000,
          premiumAnnualArs: 300_000,
        }}
      />
    </div>
  );
}

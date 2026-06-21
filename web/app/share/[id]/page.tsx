import Link from "next/link";
import { RABBIT_HOLES, getHole } from "@/lib/data";
import { HoleSummaryCard } from "@/components/summaries/HoleSummaryCard";
import { InvestigationReplay } from "@/components/replay/InvestigationReplay";
import { DiscoveryPathPanel } from "@/components/discovery/DiscoveryPathPanel";
import { HoleMapView } from "@/components/HoleMapView";

export function generateStaticParams() {
  return RABBIT_HOLES.map((h) => ({ id: h.id }));
}

export default function SharePage({ params }: { params: { id: string } }) {
  const hole = getHole(params.id);
  if (!hole) {
    return (
      <div className="rh-paper flex min-h-screen items-center justify-center px-6">
        <div className="rounded-[20px] border border-[#785a3224] bg-[#fbf6ec] p-8 text-center">
          <div className="rh-display text-[30px] font-semibold text-[#2a2018]">Shared hole not found</div>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-full bg-[#2a2018] px-5 py-3 text-[#f3e8d4]">Open Rabbit Holes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rh-paper min-h-screen px-5 py-8 sm:px-8 xl:px-12">
      <div className="mx-auto w-full max-w-[1320px] space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#a8967d]">Rabbit Holes</div>
            <h1 className="rh-display text-[46px] font-semibold leading-none text-[#2a2018]">How I learned {hole.title}</h1>
          </div>
          <Link href="/" className="rounded-full bg-[#2a2018] px-5 py-3 text-[14px] font-semibold text-[#f3e8d4] no-underline">Make your own</Link>
        </header>
        <HoleSummaryCard hole={hole} publicMode />
        <div className="h-[720px] overflow-hidden rounded-[24px] border border-[#785a3224] bg-[#fbf6ec]">
          <HoleMapView id={hole.id} embedded />
        </div>
        <InvestigationReplay hole={hole} />
        <DiscoveryPathPanel hole={hole} />
      </div>
    </div>
  );
}

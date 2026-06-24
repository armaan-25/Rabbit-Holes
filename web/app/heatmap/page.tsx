"use client";

import { CuriosityHeatmap } from "@/components/heatmaps/CuriosityHeatmap";
import { EmptyHolesPage } from "@/components/EmptyHoles";
import { useHoles } from "@/hooks/useHoles";

export default function HeatmapPage() {
  const holes = useHoles();
  if (holes.length === 0) {
    return <EmptyHolesPage eyebrow="Heatmap" title="No habits to chart yet" hint="As you explore with the extension on, your busiest topics and times of day will fill in here." />;
  }
  return (
    <div className="rh-paper min-h-screen px-5 py-8 sm:px-8 xl:px-12">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="mb-7">
          <div className="rh-faint mb-2 text-[12px] font-semibold uppercase tracking-[0.22em]">Habits</div>
          <h1 className="rh-display rh-ink text-[44px] font-semibold leading-none">Curiosity heatmap</h1>
          <p className="rh-muted mt-3 max-w-2xl text-[16px] leading-relaxed">Intensity, topics, and rhythm across your recent exploration sessions.</p>
        </div>
        <CuriosityHeatmap holes={holes} />
      </div>
    </div>
  );
}

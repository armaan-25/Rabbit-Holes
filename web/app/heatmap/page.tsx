"use client";

import { CuriosityHeatmap } from "@/components/heatmaps/CuriosityHeatmap";
import { useHoles } from "@/hooks/useHoles";

export default function HeatmapPage() {
  const holes = useHoles();
  return (
    <div className="rh-paper min-h-screen px-5 py-8 sm:px-8 xl:px-12">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="mb-7">
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#a8967d]">Habits</div>
          <h1 className="rh-display text-[44px] font-semibold leading-none text-[#2a2018]">Curiosity heatmap</h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[#6a5a48]">Intensity, topics, and rhythm across your recent exploration sessions.</p>
        </div>
        <CuriosityHeatmap holes={holes} />
      </div>
    </div>
  );
}

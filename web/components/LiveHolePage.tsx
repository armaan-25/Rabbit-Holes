"use client";

import Link from "next/link";
import { getHole } from "@/lib/data";
import { useApp } from "@/lib/store";
import { HoleDetail } from "./HoleDetail";

export function LiveHolePage({ id }: { readonly id: string }) {
  const liveHoles = useApp((s) => s.liveHoles);
  const hole = liveHoles.find((h) => h.id === id) ?? getHole(id);

  if (!hole) {
    return (
      <div className="rh-paper flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-[20px] border border-[#785a3224] bg-[#fbf6ec] p-8 text-center shadow-[0_2px_18px_rgba(70,45,20,.06)]">
          <div className="rh-display text-[30px] font-semibold text-[#2a2018]">Rabbit hole not found</div>
          <p className="mt-3 text-[15px] leading-6 text-[#6a5a48]">
            Run clustering from the dashboard to rebuild the latest captured rabbit holes.
          </p>
          <Link
            href="/dashboard?cluster=1"
            className="mt-6 inline-flex rounded-[14px] bg-[#2a2018] px-5 py-3 text-[14px] font-semibold text-[#f6efe1]"
          >
            Build rabbit holes
          </Link>
        </div>
      </div>
    );
  }

  return <HoleDetail hole={hole} />;
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { ACCENTS } from "@/lib/ui";

const RABBIT_HOLE_IMAGE = "/assets/images/rabbit-hole-hero.png";

export function RabbitDive() {
  const discovery = useApp((s) => s.discovery);
  const clear = useApp((s) => s.clearDiscovery);
  const accent = discovery ? ACCENTS[discovery.accent] : ACCENTS.rabbit;
  const discoveries = discovery && "related" in discovery && Array.isArray(discovery.related) ? discovery.related : discovery ? [discovery] : [];
  const multiple = discoveries.length > 1;

  return (
    <AnimatePresence>
      {discovery && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clear}
        >
          <div className="absolute inset-0 bg-[#1a120c]/76 backdrop-blur-[10px]" />
          <motion.div
            className="relative w-full max-w-[720px] overflow-hidden rounded-[34px] border border-[#f3e8d426] bg-[#17100b] shadow-[0_34px_110px_rgba(18,11,5,.48)]"
            initial={{ scale: 0.96, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[390px] overflow-hidden border-b border-[#f3e8d41f] bg-[#2b2117]">
              <motion.img
                src={RABBIT_HOLE_IMAGE}
                alt=""
                draggable={false}
                className="absolute inset-x-0 bottom-[34px] mx-auto w-[500px] max-w-[86%] select-none object-contain drop-shadow-[0_24px_60px_rgba(18,11,5,.42)]"
                initial={{ y: 18, scale: 0.94, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <div className="relative bg-[#17100b] px-9 py-8 text-[#f3e8d4]">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#b69b77]">
                <span
                  className="h-2 w-2 rounded-full shadow-[0_0_14px_currentColor]"
                  style={{ background: accent.hex, color: accent.hex }}
                />
                {multiple ? `${discoveries.length} new rabbit holes` : "New rabbit hole"}
              </div>

              {multiple ? (
                <>
                  <h2 className="rh-display text-[42px] font-semibold leading-none text-[#f6ecd9]">
                    Built {discoveries.length} rabbit holes
                  </h2>
                  <p className="mt-4 max-w-[560px] text-[18px] leading-7 text-[#d8c8ad]">
                    Rabbit Holes found multiple clean threads in this session. Open one now or stay here and review them in the dashboard.
                  </p>
                  <div className="mt-7 grid gap-3">
                    {discoveries.map((item) => {
                      const itemAccent = ACCENTS[item.accent] ?? ACCENTS.rabbit;
                      return (
                        <a
                          key={item.id}
                          href={`/holes/${item.id}`}
                          onClick={clear}
                          className="group flex items-center gap-4 rounded-[18px] border border-[#f3e8d426] bg-[#21170f] px-5 py-4 text-[#f6ecd9] no-underline transition hover:-translate-y-0.5 hover:border-[#f3e8d466]"
                        >
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_14px_currentColor]" style={{ background: itemAccent.hex, color: itemAccent.hex }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[19px] font-semibold">{item.title}</span>
                            <span className="mt-1 block text-[13px] text-[#b8a486]">
                              {item.pages} pages · {item.searches} searches
                            </span>
                          </span>
                          <span className="text-[20px] text-[#cdbd9f] transition group-hover:translate-x-0.5">↗</span>
                        </a>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="rh-display text-[46px] font-semibold leading-none text-[#f6ecd9]">
                    {discovery.title}
                  </h2>
                  <p className="mt-4 max-w-[560px] text-[19px] leading-7 text-[#d8c8ad]">
                    Clustered {discovery.pages} pages and {discovery.searches} searches into one investigation.
                  </p>
                </>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                {!multiple && (
                  <a
                    href={`/holes/${discovery.id}`}
                    className="rounded-[16px] border border-[#f3e8d426] bg-[#2b2117] px-7 py-4 text-[17px] font-semibold text-[#f6efe1] shadow-[0_10px_28px_rgba(42,32,24,.24)] transition hover:-translate-y-0.5"
                    onClick={clear}
                  >
                    Open rabbit hole ↗
                  </a>
                )}
                <button
                  onClick={clear}
                  className="rounded-[16px] border border-[#f3e8d426] bg-transparent px-7 py-4 text-[17px] font-semibold text-[#cdbd9f] transition hover:bg-[#f3e8d40d]"
                >
                  Stay here
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

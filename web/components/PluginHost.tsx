"use client";

import { WEB_PLUGINS } from "@/lib/web-plugins";

export function PluginHost() {
  return (
    <>
      {WEB_PLUGINS.map((plugin) => {
        const Plugin = plugin.component;
        return <Plugin key={plugin.id} />;
      })}
    </>
  );
}

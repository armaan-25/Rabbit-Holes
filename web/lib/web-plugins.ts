import type { ComponentType } from "react";
import { RabbitDive } from "@/components/RabbitDive";
import { CommandPalette } from "@/components/CommandPalette";

export interface WebPlugin {
  id: string;
  label: string;
  component: ComponentType;
}

export const WEB_PLUGINS: WebPlugin[] = [
  {
    id: "command-palette",
    label: "command palette",
    component: CommandPalette,
  },
  {
    id: "rabbit-dive-overlay",
    label: "rabbit dive overlay",
    component: RabbitDive,
  },
];

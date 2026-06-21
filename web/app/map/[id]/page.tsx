"use client";

import { HoleMapView } from "@/components/HoleMapView";

export default function HoleMapPage({ params }: { params: { id: string } }) {
  return <HoleMapView id={params.id} />;
}

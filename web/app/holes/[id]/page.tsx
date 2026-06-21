import { RABBIT_HOLES } from "@/lib/data";
import { LiveHolePage } from "@/components/LiveHolePage";

export function generateStaticParams() {
  return RABBIT_HOLES.map((h) => ({ id: h.id }));
}

export default function HolePage({ params }: { params: { id: string } }) {
  return <LiveHolePage id={params.id} />;
}

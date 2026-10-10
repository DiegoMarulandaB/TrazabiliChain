import { PublicLotPage } from "@/components/public-lot/PublicLotPage";

export default async function LotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicLotPage id={id} />;
}

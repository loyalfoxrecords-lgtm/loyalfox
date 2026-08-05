export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ArtistDetail = (await import("@/components/ArtistDetail")).default;
  return <ArtistDetail slug={slug} />;
}
import StreamerDetail from "@/components/StreamerDetail";

export default function StreamerPage({ params }: { params: { slug: string } }) {
  return <StreamerDetail slug={params.slug} />;
}
export default async function OverlayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const StreamerOverlay = (await import("@/components/overlay/StreamerOverlay")).default;
  return <StreamerOverlay token={token} />;
}
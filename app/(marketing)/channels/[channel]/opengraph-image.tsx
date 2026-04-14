import { ImageResponse } from "next/og";
import { CHANNELS } from "@/lib/channels";
import { OG_CONTENT_TYPE, OG_SIZE, loadOgFonts, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Aloha for this channel";

export default async function ChannelOg({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  const { channel } = await params;
  const c = CHANNELS[channel];
  const fonts = [...loadOgFonts()];
  if (!c) {
    return new ImageResponse(
      ogCard({ eyebrow: "Channels", title: "Aloha for every channel." }),
      { ...size, fonts },
    );
  }
  return new ImageResponse(
    ogCard({
      eyebrow: `For ${c.name}`,
      title: `${c.headline.line1} ${c.headline.line2}`.trim(),
      subtitle: c.lead,
    }),
    { ...size, fonts },
  );
}

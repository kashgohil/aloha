import type { PostMedia, StudioPayload } from "@/db/schema";

export type TikTokPrivacyLevel =
  | "PUBLIC_TO_EVERYONE"
  | "MUTUAL_FOLLOW_FRIENDS"
  | "FOLLOWER_OF_CREATOR"
  | "SELF_ONLY";

export type TikTokPayload = {
  title: string;
  video: PostMedia[];
  privacyLevel: TikTokPrivacyLevel;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  brandContentToggle: boolean;
  brandOrganicToggle: boolean;
};

const PRIVACY_VALUES: TikTokPrivacyLevel[] = [
  "PUBLIC_TO_EVERYONE",
  "MUTUAL_FOLLOW_FRIENDS",
  "FOLLOWER_OF_CREATOR",
  "SELF_ONLY",
];

export function readTikTokPayload(payload: StudioPayload): TikTokPayload {
  const title = typeof payload.title === "string" ? payload.title : "";
  const video = Array.isArray(payload.video)
    ? (payload.video as PostMedia[])
    : [];
  const privacyLevel =
    typeof payload.privacyLevel === "string" &&
    PRIVACY_VALUES.includes(payload.privacyLevel as TikTokPrivacyLevel)
      ? (payload.privacyLevel as TikTokPrivacyLevel)
      : "PUBLIC_TO_EVERYONE";
  return {
    title,
    video,
    privacyLevel,
    disableComment: payload.disableComment === true,
    disableDuet: payload.disableDuet === true,
    disableStitch: payload.disableStitch === true,
    brandContentToggle: payload.brandContentToggle === true,
    brandOrganicToggle: payload.brandOrganicToggle === true,
  };
}

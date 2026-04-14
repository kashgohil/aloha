import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function OnboardingIndex() {
  redirect(routes.onboarding.workspace);
}

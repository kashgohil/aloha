import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function NotFound() {
  const user = await getCurrentUser();
  redirect(user ? "/app/dashboard" : "/");
}

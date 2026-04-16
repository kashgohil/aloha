"use server";

import { db } from "@/db";
import { wishlist } from "@/db/schema";

export async function joinWishlist(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const message = (formData.get("message") as string)?.trim() || null;

  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email." };
  }

  try {
    await db.insert(wishlist).values({ name, email, message });
    return { success: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn } from "@/auth";
import { env } from "@/lib/env";
import { createVerificationToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { verifyEmail } from "@/lib/email/templates/verify";

export type AuthFormState = {
  error: string | null;
  info: string | null;
};

const INITIAL: AuthFormState = { error: null, info: null };

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

function normalizeRedirect(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/app/dashboard";
}

function buildVerifyUrl(token: string): string {
  const base = env.APP_URL.replace(/\/$/, "");
  return `${base}/auth/verify?token=${encodeURIComponent(token)}`;
}

async function issueVerificationEmail(email: string, name: string | null) {
  const { token } = await createVerificationToken(email);
  const tpl = verifyEmail({ verifyUrl: buildVerifyUrl(token), name });
  await sendEmail({ to: email, ...tpl });
}

export async function signinWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ...INITIAL, error: "Enter a valid email and password." };
  }

  const email = parsed.data.email.toLowerCase();
  const redirectTo = normalizeRedirect(formData.get("redirectTo"));

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (err) {
    if (err instanceof CredentialsSignin && err.code === "EmailNotVerified") {
      const [user] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      try {
        await issueVerificationEmail(email, user?.name ?? null);
      } catch {
        // swallow; surface generic message
      }

      return {
        error: null,
        info: "Almost there — we just sent a fresh verification link to your inbox.",
      };
    }

    if (err instanceof AuthError) {
      return { ...INITIAL, error: "Email or password is incorrect." };
    }
    throw err;
  }

  return INITIAL;
}

export async function signupWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path[0];
    if (field === "password") {
      return { ...INITIAL, error: "Password must be at least 8 characters." };
    }
    if (field === "email") {
      return { ...INITIAL, error: "Enter a valid email address." };
    }
    return { ...INITIAL, error: "Please fill in every field." };
  }

  const email = parsed.data.email.toLowerCase();

  const [existing] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing?.passwordHash && existing.emailVerified) {
    return {
      ...INITIAL,
      error: "An account with that email already exists. Sign in instead.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        name: parsed.data.name,
        emailVerified: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      name: parsed.data.name,
      email,
      passwordHash,
    });
  }

  try {
    await issueVerificationEmail(email, parsed.data.name);
  } catch (err) {
    console.error("Failed to send verification email", err);
    return {
      ...INITIAL,
      error:
        "We created your account but couldn't send the verification email. Try signing in to trigger a resend.",
    };
  }

  redirect(`/auth/verify-request?email=${encodeURIComponent(email)}`);
}

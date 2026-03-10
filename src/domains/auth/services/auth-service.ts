import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { User } from "@supabase/supabase-js";

export async function signUp(email: string, password: string, orgName: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { org_name: orgName },
    },
  });
  if (error) throw new Error(error.message);

  if (data.session) {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
    });
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);

  if (data.session) {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
    });
  }

  return data;
}

export async function signOut() {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

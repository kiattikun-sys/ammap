import { cookies } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter((c) => c.name.includes("supabase") || c.name.includes("sb-"));

  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  return Response.json({
    totalCookies: allCookies.length,
    supabaseCookieNames: supabaseCookies.map((c) => c.name),
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
  });
}

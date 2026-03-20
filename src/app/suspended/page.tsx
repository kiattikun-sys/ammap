import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { redirect } from "next/navigation";
import { ShieldOff } from "lucide-react";

export default async function SuspendedPage() {
  const db = (await createSupabaseServer()) as any;
  const {
    data: { user },
  } = await db.auth.getUser();

  // If somehow a non-suspended user lands here, redirect them away
  if (user) {
    const adminDb = createSupabaseAdmin() as any;
    const { data: profile } = await adminDb
      .from("profiles")
      .select("status, suspension_reason")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.status !== "suspended") {
      redirect("/dashboard");
    }

    const reason: string | null = profile.suspension_reason ?? null;

    return <SuspendedView email={user.email ?? ""} reason={reason} />;
  }

  // Not logged in — redirect to login
  redirect("/login");
}

function SuspendedView({
  email,
  reason,
}: {
  email: string;
  reason: string | null;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <ShieldOff size={26} className="text-red-600" />
        </div>

        <h1 className="mb-2 text-xl font-bold text-slate-900">
          Account Suspended
        </h1>
        <p className="mb-1 text-sm text-slate-500">
          Your account (<span className="font-medium text-slate-700">{email}</span>) has been
          suspended by a platform administrator.
        </p>

        {reason && (
          <div className="my-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
              Reason
            </p>
            <p className="text-sm text-slate-700">{reason}</p>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">
          If you believe this is an error, please contact your platform
          administrator directly.
        </p>

        <form
          action="/auth/signout"
          method="post"
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

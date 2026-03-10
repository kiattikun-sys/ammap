"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/domains/auth/services/auth-service";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
    >
      Sign out
    </button>
  );
}

import { redirect } from "next/navigation";

/**
 * /signup is disabled under Model A approval-first onboarding.
 * All new users must submit a registration request at /register.
 */
export default function SignupPage() {
  redirect("/register");
}

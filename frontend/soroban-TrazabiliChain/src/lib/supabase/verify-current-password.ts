import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function verifyCurrentPassword(password: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !password) return false;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return false;

    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: data.user.email,
      password,
    });
    return !passwordError;
  } catch {
    return false;
  }
}

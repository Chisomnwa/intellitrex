import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase/config";

export async function DELETE() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in before deleting your account." }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Account deletion is not configured on the server." }, { status: 503 });
  }

  const { url } = getSupabaseConfig();
  const adminClient = createSupabaseAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Account deletion failed. Please try again." }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}

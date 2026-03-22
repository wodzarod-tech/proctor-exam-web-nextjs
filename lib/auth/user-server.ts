/* Server side */
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

// get user from supabase
export async function getUser() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  console.log("getUser=",user);

  return user;
}
import LoginDemo from "./LoginDemo";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export default async function EmailPasswordPage({ params }) {
  const { locale } = await params;

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log( { user });
  console.log("EmailPasswordPage user=",user);
  
  // 🔥 Prevent logged users from seeing login page
  if (user) {
    redirect(`/${locale}`);
  }

  return <LoginDemo user={user} />;
}
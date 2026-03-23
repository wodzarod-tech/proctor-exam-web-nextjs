import { createSupabaseServerClient } from "@/lib/supabase/server-client";

// /api/feedback
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from('feedback')
    .insert([body]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return Response.json(data);
}
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

// /api/feedback
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("BODY:", body);

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('feedback')
      .insert([body]);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return new Response(JSON.stringify({ error: "Server crashed" }), { status: 500 });
  }
}
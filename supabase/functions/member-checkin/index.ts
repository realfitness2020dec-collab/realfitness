import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { member_id, qr_code_used } = await req.json();

    if (!member_id) {
      return new Response(
        JSON.stringify({ error: "Member ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify member exists and is active
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, full_name, is_active, package_end_date")
      .eq("id", member_id)
      .maybeSingle();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: "Member not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!member.is_active) {
      return new Response(
        JSON.stringify({ error: "Membership is inactive" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (member.package_end_date && new Date(member.package_end_date) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Membership has expired" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .insert({
        member_id: member_id,
        qr_code_used: qr_code_used || null,
        check_in_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (attendanceError) {
      return new Response(
        JSON.stringify({ error: "Failed to record attendance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, attendance, member_name: member.full_name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

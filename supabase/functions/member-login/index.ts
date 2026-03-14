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
    const { member_id, password } = await req.json();
    const normalizedMemberId = String(member_id || "").trim().toUpperCase();
    const normalizedPassword = typeof password === "string" ? password.trim() : "";

    if (!normalizedMemberId) {
      return new Response(
        JSON.stringify({ error: "Member ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: member, error } = await supabase
      .from("members")
      .select("*, gym_packages(*)")
      .eq("member_id", normalizedMemberId)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to look up member" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!member) {
      return new Response(
        JSON.stringify({ error: "Member ID not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storedPassword = typeof member.password === "string" ? member.password.trim() : "";

    if (storedPassword) {
      if (!normalizedPassword) {
        return new Response(
          JSON.stringify({ error: "Password is required", requiresPassword: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (normalizedPassword !== storedPassword) {
        return new Response(
          JSON.stringify({ error: "Invalid password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!member.is_active) {
      return new Response(
        JSON.stringify({ error: "Your membership is inactive. Please contact the gym." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { password: _password, ...memberWithoutPassword } = member;

    return new Response(
      JSON.stringify({ member: memberWithoutPassword }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, memberProfile, fitnessProfile, recentWorkouts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const fitnessGoalText = fitnessProfile?.fitness_goal === "weight_loss" ? "Weight Loss" 
      : fitnessProfile?.fitness_goal === "weight_gain" ? "Weight Gain" 
      : fitnessProfile?.fitness_goal === "maintenance" ? "Maintenance" : "Not specified";
    
    const dietText = fitnessProfile?.diet_type === "veg" ? "Vegetarian" : fitnessProfile?.diet_type === "non_veg" ? "Non-Vegetarian" : "Not specified";
    const activityText = fitnessProfile?.activity_level === "active" ? "Active person" : fitnessProfile?.activity_level === "moderate" ? "Moderate activity" : fitnessProfile?.activity_level === "lazy" ? "Sedentary/Lazy" : "Not specified";
    const alcoholText = fitnessProfile?.alcohol_consumption ? "Yes" : "No";
    const physicalIssuesText = fitnessProfile?.physical_issues || "None reported";

    const recentWorkoutSummary = recentWorkouts && recentWorkouts.length > 0
      ? `\n\nRecent workout history (last few days):\n${recentWorkouts.map((w: { date: string; content: string }) => `- ${w.date}: ${w.content}`).join("\n")}`
      : "\n\nNo previous workout history available - this might be a new member.";

    const systemPrompt = `You are Coach Siva's AI assistant at Real Fitness Gym, Kunnathur. You give clean, no-nonsense workouts.

Member Profile:
- Name: ${memberProfile?.name || "Member"}
- Weight: ${memberProfile?.weight ? memberProfile.weight + " kg" : "Not provided"}
- Height: ${memberProfile?.height ? memberProfile.height + " cm" : "Not provided"}
- Membership Status: ${memberProfile?.isActive ? "Active" : "Inactive"}

Fitness Profile:
- Goal: ${fitnessGoalText}
- Diet: ${dietText}
- Alcohol: ${alcoholText}
- Physical Issues/Pain: ${physicalIssuesText}
- Activity Level: ${activityText}
${recentWorkoutSummary}

IMPORTANT RULES:
1. Give ONLY the workout as a clean bullet-point list. Each exercise on a SINGLE LINE.
2. Format STRICTLY like this (no extra text):
   🏋️ Today's Workout - [Muscle Group]
   • Exercise Name - Sets x Reps
   • Exercise Name - Sets x Reps
   • Exercise Name - Sets x Reps

3. Do NOT include explanations, motivational quotes, "why this works", real examples, or any extra text. JUST the workout list.

4. ALL exercises must be bodyweight or dumbbell/barbell only. NO MACHINE exercises. No cable machines, no smith machine, no leg press machine. Only free weights and bodyweight.

5. ALWAYS vary the workout based on their previous days. Don't repeat the same muscle group.

6. Consider their physical issues - NEVER suggest exercises that could hurt them.

7. For weight loss: focus on HIIT + bodyweight circuits
   For weight gain: focus on heavy compound free weight movements

8. If they ask about diet, give a simple bullet list of foods - no long paragraphs. Use local food examples (idli, dosa, rice, chicken, eggs, etc.)

9. If they ask fun/silly questions, give a SHORT fun reply (1 line max) then the workout.

10. If no fitness profile is set yet, ask them about their goals briefly.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please contact the gym admin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("workout-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

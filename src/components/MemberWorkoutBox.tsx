import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Calendar } from "lucide-react";
import type { MemberWorkout } from "@/services/supabase";

interface MemberWorkoutBoxProps {
  memberId: string;
}

const MemberWorkoutBox = ({ memberId }: MemberWorkoutBoxProps) => {
  const [workouts, setWorkouts] = useState<MemberWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts();
  }, [memberId]);

  const fetchWorkouts = async () => {
    if (!memberId) {
      setWorkouts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("member-workouts", {
        body: { member_id: memberId, limit: 7 },
      });

      if (!error && Array.isArray(data?.workouts)) {
        setWorkouts(data.workouts);
        return;
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("member_workouts")
        .select("*")
        .eq("member_id", memberId)
        .order("workout_date", { ascending: false })
        .limit(7);

      if (fallbackError) {
        throw fallbackError;
      }

      setWorkouts((fallbackData as MemberWorkout[]) || []);
    } catch (e) {
      console.error("Failed to fetch workouts", e);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Loading workouts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Your Workout Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No workout plan assigned yet. Ask your trainer!
          </p>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div key={workout.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2 text-sm text-primary">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {new Date(workout.workout_date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{workout.workout_plan}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberWorkoutBox;

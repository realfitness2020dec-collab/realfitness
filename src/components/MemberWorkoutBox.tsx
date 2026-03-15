import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Calendar } from "lucide-react";
import type { MemberWorkout } from "@/services/supabase";

interface MemberWorkoutBoxProps {
  memberId: string;
}

type FilterType = "today" | "week" | "month";

const MemberWorkoutBox = ({ memberId }: MemberWorkoutBoxProps) => {
  const [workouts, setWorkouts] = useState<MemberWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("week");

  useEffect(() => {
    fetchWorkouts();
  }, [memberId, filter]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (filter === "today") {
      return { from: today.toISOString().split("T")[0], limit: 1 };
    }
    if (filter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo.toISOString().split("T")[0], limit: 7 };
    }
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return { from: monthAgo.toISOString().split("T")[0], limit: 30 };
  };

  const fetchWorkouts = async () => {
    if (!memberId) { setWorkouts([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { from, limit } = getDateRange();
      const { data, error } = await supabase
        .from("member_workouts")
        .select("*")
        .eq("member_id", memberId)
        .gte("workout_date", from)
        .order("workout_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setWorkouts((data as MemberWorkout[]) || []);
    } catch (e) {
      console.error("Failed to fetch workouts", e);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Your Workout Plan
        </CardTitle>
        <div className="flex gap-2 pt-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse text-muted-foreground py-4">Loading workouts...</div>
        ) : workouts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No workouts found for this period.
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

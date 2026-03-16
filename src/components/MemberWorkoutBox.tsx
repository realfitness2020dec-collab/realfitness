import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dumbbell, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { MemberWorkout } from "@/services/supabase";

interface MemberWorkoutBoxProps {
  memberId: string;
}

const MemberWorkoutBox = ({ memberId }: MemberWorkoutBoxProps) => {
  const [workouts, setWorkouts] = useState<MemberWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    fetchWorkouts();
  }, [memberId, currentMonth]);

  const fetchWorkouts = async () => {
    if (!memberId) { setWorkouts([]); setLoading(false); return; }
    setLoading(true);
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("member_workouts")
        .select("*")
        .eq("member_id", memberId)
        .gte("workout_date", startOfMonth.toISOString().split("T")[0])
        .lte("workout_date", endOfMonth.toISOString().split("T")[0])
        .order("workout_date", { ascending: true });

      if (error) throw error;
      setWorkouts((data as MemberWorkout[]) || []);
    } catch (e) {
      console.error("Failed to fetch workouts", e);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get dates that have workouts
  const workoutDates = workouts.map(w => {
    const d = new Date(w.workout_date + "T00:00:00");
    return d.toDateString();
  });

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const selectedWorkouts = workouts.filter(w => w.workout_date === selectedDateStr);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Your Workout Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse text-muted-foreground py-4">Loading workouts...</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar */}
            <div className="flex-shrink-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border border-border pointer-events-auto"
                modifiers={{
                  hasWorkout: (date) => workoutDates.includes(date.toDateString()),
                }}
                modifiersClassNames={{
                  hasWorkout: "bg-primary/20 text-primary font-bold border border-primary/40",
                }}
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
                Days with assigned workouts
              </p>
            </div>

            {/* Selected day workout */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {selectedDate.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              {selectedWorkouts.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">
                  No workout assigned for this day.
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedWorkouts.map((workout) => {
                    const rows = parseWorkoutToTable(workout.workout_plan);
                    return (
                      <div key={workout.id} className="rounded-xl border border-border overflow-hidden">
                        {rows.length > 0 ? (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-primary/10 border-b border-border">
                                <th className="text-left py-3 px-4 font-semibold text-primary">#</th>
                                <th className="text-left py-3 px-4 font-semibold text-primary">Exercise</th>
                                <th className="text-center py-3 px-4 font-semibold text-primary">Sets</th>
                                <th className="text-center py-3 px-4 font-semibold text-primary">Reps</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row, i) => (
                                <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/30' : 'bg-muted/10'} hover:bg-primary/5 transition-colors`}>
                                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{i + 1}</td>
                                  <td className="py-3 px-4 text-foreground font-medium">{row.exercise}</td>
                                  <td className="py-3 px-4 text-center text-foreground">{row.sets}</td>
                                  <td className="py-3 px-4 text-center text-foreground">{row.reps}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-4">
                            <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                              {workout.workout_plan}
                            </p>
                          </div>
                        )}
                        <div className="px-4 py-2 bg-muted/20 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            Assigned on {new Date(workout.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberWorkoutBox;

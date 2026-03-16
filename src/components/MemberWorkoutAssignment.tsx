import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Send, Loader2, Repeat, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface MemberWorkoutAssignmentProps {
  members: Member[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MemberWorkoutAssignment = ({ members }: MemberWorkoutAssignmentProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [repeatWeeks, setRepeatWeeks] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  // Weekly template state
  const [weeklyPlans, setWeeklyPlans] = useState<Record<string, string>>({
    Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "",
  });
  const [weeklyRepeat, setWeeklyRepeat] = useState("1");
  const [weeklyStartDate, setWeeklyStartDate] = useState(getNextMonday());

  function getNextMonday() {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 1 : (8 - day);
    d.setDate(d.getDate() + (day === 1 ? 0 : diff));
    return d.toISOString().split("T")[0];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !workoutPlan.trim()) {
      toast.error("Please select a member and enter a workout plan");
      return;
    }

    const weeks = parseInt(repeatWeeks) || 1;
    setSubmitting(true);
    try {
      const rows = [];
      for (let i = 0; i < weeks; i++) {
        const date = new Date(workoutDate);
        date.setDate(date.getDate() + i * 7);
        rows.push({
          member_id: selectedMemberId,
          workout_date: date.toISOString().split("T")[0],
          workout_plan: workoutPlan.trim(),
        });
      }

      const { error } = await supabase.from("member_workouts").insert(rows);
      if (error) throw error;

      const member = members.find(m => m.id === selectedMemberId);
      toast.success(
        weeks > 1
          ? `Workout assigned to ${member?.full_name || "member"} for ${weeks} weeks!`
          : `Workout assigned to ${member?.full_name || "member"}!`
      );
      setWorkoutPlan("");
      setRepeatWeeks("1");
    } catch (error) {
      toast.error("Failed to assign workout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWeeklySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error("Please select a member");
      return;
    }

    const filledDays = DAYS.filter(d => weeklyPlans[d].trim());
    if (filledDays.length === 0) {
      toast.error("Please enter at least one day's workout");
      return;
    }

    const weeks = parseInt(weeklyRepeat) || 1;
    setSubmitting(true);
    try {
      const rows: { member_id: string; workout_date: string; workout_plan: string }[] = [];
      const startDate = new Date(weeklyStartDate);
      // Adjust to Monday if not already
      const startDay = startDate.getDay();
      if (startDay !== 1) {
        const diff = startDay === 0 ? 1 : (8 - startDay);
        startDate.setDate(startDate.getDate() + diff);
      }

      for (let week = 0; week < weeks; week++) {
        DAYS.forEach((day, dayIndex) => {
          if (weeklyPlans[day].trim()) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + week * 7 + dayIndex);
            rows.push({
              member_id: selectedMemberId,
              workout_date: date.toISOString().split("T")[0],
              workout_plan: weeklyPlans[day].trim(),
            });
          }
        });
      }

      const { error } = await supabase.from("member_workouts").insert(rows);
      if (error) throw error;

      const member = members.find(m => m.id === selectedMemberId);
      toast.success(`Weekly plan assigned to ${member?.full_name || "member"} for ${weeks} week(s)! (${rows.length} workouts)`);
      setWeeklyPlans({ Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" });
      setWeeklyRepeat("1");
    } catch (error) {
      toast.error("Failed to assign weekly plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Assign Workout to Member
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Member selector - shared */}
        <div className="mb-4 space-y-2">
          <Label className="text-foreground">Select Member *</Label>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Choose member" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {members.filter(m => m.is_active).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.member_id} - {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-1"><Dumbbell className="h-3.5 w-3.5" /> Single Day</TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1"><CalendarDays className="h-3.5 w-3.5" /> Weekly Plan</TabsTrigger>
          </TabsList>

          {/* Single Day Tab */}
          <TabsContent value="single">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Start Date</Label>
                  <Input type="date" value={workoutDate} onChange={(e) => setWorkoutDate(e.target.value)} className="bg-background border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-1"><Repeat className="h-3.5 w-3.5" /> Repeat for Weeks</Label>
                  <Select value={repeatWeeks} onValueChange={setRepeatWeeks}>
                    <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {[1,2,3,4,6,8,12].map(w => (
                        <SelectItem key={w} value={String(w)}>
                          {w === 1 ? "1 Week (No repeat)" : w === 4 ? "4 Weeks (1 Month)" : w === 8 ? "8 Weeks (2 Months)" : w === 12 ? "12 Weeks (3 Months)" : `${w} Weeks`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Workout Plan *</Label>
                <Textarea value={workoutPlan} onChange={(e) => setWorkoutPlan(e.target.value)} placeholder="e.g., Chest Press 3x12, Lat Pulldown 4x10..." className="bg-background border-border text-foreground min-h-[120px]" required />
              </div>
              {parseInt(repeatWeeks) > 1 && (
                <p className="text-xs text-muted-foreground">This workout will be duplicated every week for {repeatWeeks} weeks starting from {workoutDate}.</p>
              )}
              <Button type="submit" disabled={submitting} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Assigning..." : parseInt(repeatWeeks) > 1 ? `Assign for ${repeatWeeks} Weeks` : "Assign Workout"}
              </Button>
            </form>
          </TabsContent>

          {/* Weekly Plan Tab */}
          <TabsContent value="weekly">
            <form onSubmit={handleWeeklySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Start Week (Monday)</Label>
                  <Input type="date" value={weeklyStartDate} onChange={(e) => setWeeklyStartDate(e.target.value)} className="bg-background border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-1"><Repeat className="h-3.5 w-3.5" /> Loop for Weeks</Label>
                  <Select value={weeklyRepeat} onValueChange={setWeeklyRepeat}>
                    <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {[1,2,3,4,6,8,12].map(w => (
                        <SelectItem key={w} value={String(w)}>
                          {w === 1 ? "1 Week" : w === 4 ? "4 Weeks (1 Month)" : w === 8 ? "8 Weeks (2 Months)" : w === 12 ? "12 Weeks (3 Months)" : `${w} Weeks`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-foreground font-medium">Workout for Each Day</Label>
                <div className="grid grid-cols-1 gap-3">
                  {DAYS.map((day) => (
                    <div key={day} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{day}</Label>
                      <Textarea
                        value={weeklyPlans[day]}
                        onChange={(e) => setWeeklyPlans(prev => ({ ...prev, [day]: e.target.value }))}
                        placeholder={`${day} workout (leave empty for rest day)`}
                        className="bg-background border-border text-foreground min-h-[60px] text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {parseInt(weeklyRepeat) > 1 && (
                <p className="text-xs text-muted-foreground">
                  This weekly plan will be looped for {weeklyRepeat} weeks starting from {weeklyStartDate}.
                </p>
              )}
              <Button type="submit" disabled={submitting} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                {submitting ? "Assigning..." : `Assign Weekly Plan${parseInt(weeklyRepeat) > 1 ? ` × ${weeklyRepeat} Weeks` : ""}`}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MemberWorkoutAssignment;

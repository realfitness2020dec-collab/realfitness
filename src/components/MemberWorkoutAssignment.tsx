import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Send, Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";

interface MemberWorkoutAssignmentProps {
  members: Member[];
}

const MemberWorkoutAssignment = ({ members }: MemberWorkoutAssignmentProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [repeatWeeks, setRepeatWeeks] = useState("1");
  const [submitting, setSubmitting] = useState(false);

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

      const { error } = await supabase
        .from("member_workouts")
        .insert(rows);

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

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Assign Workout to Member
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label className="text-foreground">Start Date</Label>
              <Input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-1">
                <Repeat className="h-3.5 w-3.5" /> Repeat for Weeks
              </Label>
              <Select value={repeatWeeks} onValueChange={setRepeatWeeks}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="1">1 Week (No repeat)</SelectItem>
                  <SelectItem value="2">2 Weeks</SelectItem>
                  <SelectItem value="3">3 Weeks</SelectItem>
                  <SelectItem value="4">4 Weeks (1 Month)</SelectItem>
                  <SelectItem value="6">6 Weeks</SelectItem>
                  <SelectItem value="8">8 Weeks (2 Months)</SelectItem>
                  <SelectItem value="12">12 Weeks (3 Months)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Workout Plan *</Label>
            <Textarea
              value={workoutPlan}
              onChange={(e) => setWorkoutPlan(e.target.value)}
              placeholder="e.g., Chest Press 3x12, Lat Pulldown 4x10, Bicep Curls 3x15..."
              className="bg-background border-border text-foreground min-h-[150px]"
              required
            />
          </div>
          {parseInt(repeatWeeks) > 1 && (
            <p className="text-xs text-muted-foreground">
              This workout will be duplicated every week for {repeatWeeks} weeks starting from {workoutDate}.
            </p>
          )}
          <Button type="submit" disabled={submitting} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Assigning..." : parseInt(repeatWeeks) > 1 ? `Assign for ${repeatWeeks} Weeks` : "Assign Workout"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MemberWorkoutAssignment;

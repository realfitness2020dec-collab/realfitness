import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Pencil, Trash2, Loader2, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface AdminWorkoutListProps {
  members: Member[];
}

interface Workout {
  id: string;
  member_id: string;
  workout_date: string;
  workout_plan: string;
  created_at: string;
}

const AdminWorkoutList = ({ members }: AdminWorkoutListProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMemberId, setFilterMemberId] = useState("all");
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkouts();
  }, [filterMemberId]);

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("member_workouts")
        .select("*")
        .order("workout_date", { ascending: false })
        .limit(50);

      if (filterMemberId !== "all") {
        query = query.eq("member_id", filterMemberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWorkouts((data as Workout[]) || []);
    } catch (e) {
      console.error("Failed to fetch workouts", e);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.member_id} - ${member.full_name}` : memberId;
  };

  const openEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setEditPlan(workout.workout_plan);
    setEditDate(workout.workout_date);
  };

  const handleUpdate = async () => {
    if (!editingWorkout) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("member_workouts")
        .update({ workout_plan: editPlan.trim(), workout_date: editDate })
        .eq("id", editingWorkout.id);
      if (error) throw error;
      toast.success("Workout updated!");
      setEditingWorkout(null);
      fetchWorkouts();
    } catch {
      toast.error("Failed to update workout");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("member_workouts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Workout deleted!");
      fetchWorkouts();
    } catch {
      toast.error("Failed to delete workout");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Assigned Workouts
        </CardTitle>
        <div className="pt-2">
          <Select value={filterMemberId} onValueChange={setFilterMemberId}>
            <SelectTrigger className="bg-background border-border text-foreground w-full max-w-xs">
              <SelectValue placeholder="Filter by member" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              <SelectItem value="all">All Members</SelectItem>
              {members.filter(m => m.is_active).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.member_id} - {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse text-muted-foreground py-4">Loading...</div>
        ) : workouts.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No workouts assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => (
              <div key={w.id} className="p-4 bg-muted/50 rounded-lg border border-border flex flex-col md:flex-row md:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-primary flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {getMemberName(w.member_id)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(w.workout_date).toLocaleDateString("en-IN", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-foreground text-sm whitespace-pre-wrap line-clamp-3">
                    {w.workout_plan}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(w)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Workout?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this workout assignment.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(w.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingWorkout} onOpenChange={(open) => !open && setEditingWorkout(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Workout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Workout Date</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Workout Plan</Label>
                <Textarea
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="bg-background border-border text-foreground min-h-[150px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingWorkout(null)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminWorkoutList;

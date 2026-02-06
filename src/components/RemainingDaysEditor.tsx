import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarPlus } from "lucide-react";
import { membersService, type Member } from "@/services/supabase";
import { toast } from "sonner";

interface RemainingDaysEditorProps {
  member: Member;
  onUpdated: () => void;
}

const RemainingDaysEditor = ({ member, onUpdated }: RemainingDaysEditorProps) => {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentRemaining = member.package_end_date
    ? Math.max(0, Math.ceil((new Date(member.package_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSetDays = async () => {
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays < 0) {
      toast.error("Please enter a valid number of days");
      return;
    }

    setSubmitting(true);
    try {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + numDays);

      await membersService.update(member.id, {
        package_end_date: newEndDate.toISOString().split("T")[0],
      });

      toast.success(`Updated! ${member.full_name} now has ${numDays} days remaining.`);
      setOpen(false);
      setDays("");
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDays = async () => {
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays <= 0) {
      toast.error("Please enter a valid number of days to add");
      return;
    }

    setSubmitting(true);
    try {
      const baseDate = member.package_end_date
        ? new Date(Math.max(new Date(member.package_end_date).getTime(), Date.now()))
        : new Date();
      baseDate.setDate(baseDate.getDate() + numDays);

      await membersService.update(member.id, {
        package_end_date: baseDate.toISOString().split("T")[0],
      });

      toast.success(`Added ${numDays} days to ${member.full_name}'s membership!`);
      setOpen(false);
      setDays("");
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Manage remaining days">
          <CalendarPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Manage Days - {member.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Current Remaining Days</p>
            <p className={`text-3xl font-bold ${currentRemaining > 7 ? "text-green-400" : currentRemaining > 0 ? "text-orange-400" : "text-red-400"}`}>
              {currentRemaining}
            </p>
            {member.package_end_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Expires: {new Date(member.package_end_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Number of Days</Label>
            <Input
              type="number"
              min="0"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Enter number of days"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddDays}
              disabled={submitting || !days}
              className="flex-1"
              variant="outline"
            >
              ➕ Add Days
            </Button>
            <Button
              onClick={handleSetDays}
              disabled={submitting || !days}
              className="flex-1"
            >
              📅 Set Total Days
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            "Add Days" extends from current expiry. "Set Total Days" resets from today.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemainingDaysEditor;

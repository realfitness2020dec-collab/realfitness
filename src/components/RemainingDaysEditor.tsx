import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, CalendarPlus } from "lucide-react";
import { membersService, type Member } from "@/services/supabase";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RemainingDaysEditorProps {
  member: Member;
  onUpdated: () => void;
}

const RemainingDaysEditor = ({ member, onUpdated }: RemainingDaysEditorProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const currentRemaining = member.package_end_date
    ? Math.max(0, Math.ceil((new Date(member.package_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSetExpiryDate = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    setSubmitting(true);
    try {
      const newEndDate = format(date, "yyyy-MM-dd");

      await membersService.update(member.id, {
        package_end_date: newEndDate,
      });

      const diffTime = Math.abs(date.getTime() - new Date().getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      toast.success(`Updated! ${member.full_name} now has ${diffDays} days remaining.`);
      setOpen(false);
      setDate(undefined);
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setDate(undefined);
      }
    }}>
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a new expiry date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleSetExpiryDate}
            disabled={submitting || !date}
            className="w-full"
          >
            📅 Set Expiry Date
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemainingDaysEditor;

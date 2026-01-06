import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { attendanceService } from "@/integrations/firebase/services";
import { format, isToday, startOfMonth, endOfMonth } from "date-fns";
import type { Attendance } from "@/integrations/firebase/types";

interface AttendanceStatusProps {
  memberId: string;
  memberName: string;
}

const AttendanceStatus = ({ memberId, memberName }: AttendanceStatusProps) => {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceStatus();
  }, [memberId]);

  const fetchAttendanceStatus = async () => {
    try {
      const records = await attendanceService.getByMemberId(memberId, 50);
      
      // Check if attended today
      const todayRecord = records.find(r => 
        r.check_in_time && isToday(new Date(r.check_in_time))
      );
      setTodayAttendance(todayRecord || null);

      // Count this month's attendance
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthlyRecords = records.filter(r => {
        if (!r.check_in_time) return false;
        const checkInDate = new Date(r.check_in_time);
        return checkInDate >= monthStart && checkInDate <= monthEnd;
      });
      setMonthlyCount(monthlyRecords.length);
    } catch (error) {
      console.error("Failed to fetch attendance status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Loading status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 transition-all ${
      todayAttendance 
        ? "bg-green-500/10 border-green-500/30" 
        : "bg-card border-border"
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Today's Status */}
          <div className="flex items-center gap-4">
            {todayAttendance ? (
              <>
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-green-400">Checked In!</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {todayAttendance.check_in_time && format(new Date(todayAttendance.check_in_time), "hh:mm a")}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-muted">
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">Not Checked In</p>
                  <p className="text-sm text-muted-foreground">
                    Scan the gym QR code to check in
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Monthly Stats */}
          <div className="text-center md:text-right p-4 bg-muted/30 rounded-lg">
            <p className="text-3xl font-bold text-primary">{monthlyCount}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "MMMM")} Visits
            </p>
          </div>
        </div>

        {todayAttendance && (
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg text-center">
            <p className="text-green-400 font-medium">
              🎉 Great job, {memberName.split(" ")[0]}! Keep up the good work!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceStatus;

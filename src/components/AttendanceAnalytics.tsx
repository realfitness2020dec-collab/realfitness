import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { CalendarDays, TrendingUp, Clock, Users } from "lucide-react";

interface AttendanceRecord {
  id: string;
  member_id: string;
  check_in_time: string;
  members?: { full_name: string; member_id: string };
}

interface DailyData {
  date: string;
  count: number;
}

interface HourlyData {
  hour: string;
  count: number;
}

const AttendanceAnalytics = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch today's count
      const { count: today } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .gte("check_in_time", todayStart);
      setTodayCount(today || 0);

      // Fetch week's count
      const { count: week } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .gte("check_in_time", weekStart);
      setWeekCount(week || 0);

      // Fetch month's count
      const { count: month } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .gte("check_in_time", monthStart);
      setMonthCount(month || 0);

      // Fetch recent attendance with member details
      const { data: recent } = await supabase
        .from("attendance")
        .select("id, member_id, check_in_time, members(full_name, member_id)")
        .order("check_in_time", { ascending: false })
        .limit(10);
      setRecentAttendance((recent as AttendanceRecord[]) || []);

      // Fetch last 7 days data for chart
      const { data: weekData } = await supabase
        .from("attendance")
        .select("check_in_time")
        .gte("check_in_time", weekStart);

      if (weekData) {
        const dailyCounts: Record<string, number> = {};
        const hourlyCounts: Record<number, number> = {};
        
        weekData.forEach((record) => {
          const date = new Date(record.check_in_time);
          const dateKey = date.toLocaleDateString("en-US", { weekday: "short" });
          dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
          
          const hour = date.getHours();
          hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        });

        // Generate last 7 days labels
        const days: DailyData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString("en-US", { weekday: "short" });
          days.push({ date: label, count: dailyCounts[label] || 0 });
        }
        setDailyData(days);

        // Generate hourly data
        const hours: HourlyData[] = [];
        for (let i = 5; i <= 22; i++) {
          hours.push({ 
            hour: `${i.toString().padStart(2, "0")}:00`, 
            count: hourlyCounts[i] || 0 
          });
        }
        setHourlyData(hours);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Check-ins</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{todayCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{weekCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{monthCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Daily Check-ins (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" interval={2} />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Check-ins */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground">Member ID</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-primary font-mono font-bold">
                        {record.members?.member_id || "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {record.members?.full_name || "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {new Date(record.check_in_time).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(record.check_in_time).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No attendance records yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceAnalytics;

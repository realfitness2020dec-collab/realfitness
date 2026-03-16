import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Member, Attendance } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Package, Calendar, Scale, Ruler, Home, Bell } from "lucide-react";
import realFitnessLogo from "@/assets/real-fitness-logo.png";
import MemberProgressPhotos from "@/components/MemberProgressPhotos";
import MemberQRScanner from "@/components/MemberQRScanner";
import DailyMotivation from "@/components/DailyMotivation";
import AttendanceStatus from "@/components/AttendanceStatus";
import MemberWorkoutChat from "@/components/MemberWorkoutChat";
import MemberWorkoutBox from "@/components/MemberWorkoutBox";
import InstallPrompt from "@/components/InstallPrompt";

const MemberPortal = () => {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    // Check localStorage first (persistent), then sessionStorage (legacy)
    const storedMember = localStorage.getItem("member") || sessionStorage.getItem("member");
    if (!storedMember) {
      navigate("/member");
      return;
    }
    const memberData = JSON.parse(storedMember);
    setMember(memberData);
    // Ensure it's in localStorage for persistence
    localStorage.setItem("member", JSON.stringify(memberData));
    sessionStorage.removeItem("member");
    fetchAttendance(memberData.id);
  }, [navigate]);

  const fetchAttendance = async (memberId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("member-attendance", {
        body: { member_id: memberId, limit: 10 },
      });
      if (!error && data?.attendance) {
        setAttendance(data.attendance);
      }
    } catch (e) {
      console.error("Failed to fetch attendance", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("member");
    sessionStorage.removeItem("member");
    navigate("/");
  };

  if (!member) return null;

  const daysRemaining = member.package_end_date 
    ? Math.max(0, Math.ceil((new Date(member.package_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={realFitnessLogo} alt="Real Fitness" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-foreground font-[family-name:var(--font-display)]">
                REAL FITNESS
              </h1>
              <p className="text-sm text-muted-foreground">Member Portal</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <DailyMotivation />

        {daysRemaining <= 7 && daysRemaining > 0 && (
          <Card className="bg-orange-500/10 border-orange-500/30 border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <Bell className="h-6 w-6 text-orange-400 animate-pulse" />
              <div>
                <p className="font-bold text-orange-400">Membership Expiring Soon!</p>
                <p className="text-sm text-muted-foreground">
                  Your membership expires in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}. Please renew to continue your fitness journey.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <AttendanceStatus memberId={member.id} memberName={member.full_name} />

        {/* Profile Section */}
        <Card className="bg-card border-border animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.full_name} className="w-32 h-32 rounded-full object-cover border-4 border-primary" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)]">{member.full_name}</h2>
                <p className="text-primary font-mono text-xl font-bold">{member.member_id}</p>
                <p className="text-muted-foreground">{member.phone}</p>
                {member.email && <p className="text-muted-foreground">{member.email}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Days Left</CardTitle></CardHeader>
            <CardContent><p className={`text-2xl font-bold ${daysRemaining > 7 ? "text-green-400" : "text-red-400"}`}>{daysRemaining}</p></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Package</CardTitle></CardHeader>
            <CardContent><p className="text-lg font-bold text-foreground">Active</p></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Scale className="h-4 w-4 text-primary" />Weight</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{member.weight ? `${member.weight} kg` : "-"}</p></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" />Height</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{member.height ? `${member.height} cm` : "-"}</p></CardContent>
          </Card>
        </div>

        {/* Membership Details */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-foreground">Membership Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Start Date</p><p className="text-foreground font-medium">{member.package_start_date ? new Date(member.package_start_date).toLocaleDateString() : "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">End Date</p><p className="text-foreground font-medium">{member.package_end_date ? new Date(member.package_end_date).toLocaleDateString() : "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Address</p><p className="text-foreground font-medium">{member.address || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${member.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{member.is_active ? "Active" : "Inactive"}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Workout Plan from Admin */}
        <MemberWorkoutBox memberId={member.id} />

        {/* Scan to Check-In */}
        <MemberQRScanner member={member} onSuccess={() => fetchAttendance(member.id)} />

        {/* Progress Photos */}
        <MemberProgressPhotos memberId={member.id} />

        {/* AI Workout Coach */}
        <MemberWorkoutChat member={member} />

        {/* Attendance History */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-foreground">Recent Attendance</CardTitle></CardHeader>
          <CardContent>
            {attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-foreground">{new Date(record.check_in_time || "").toLocaleDateString()}</span>
                    <span className="text-muted-foreground">{new Date(record.check_in_time || "").toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No attendance records yet</p>
            )}
          </CardContent>
        </Card>
      </main>
      <InstallPrompt />
    </div>
  );
};

export default MemberPortal;

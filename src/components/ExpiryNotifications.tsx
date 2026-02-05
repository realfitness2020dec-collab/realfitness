import { useEffect, useState } from "react";
import { membersService, packagesService } from "@/services/supabase";
import type { Member, GymPackage } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Phone, Mail, Send, CheckCircle2, Loader2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";

type MemberWithPackage = Member & {
  gym_packages?: GymPackage | null;
  notificationSent?: boolean;
};

const ExpiryNotifications = () => {
  const [expiringMembers, setExpiringMembers] = useState<MemberWithPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    fetchExpiringMembers();
  }, []);

  const fetchExpiringMembers = async () => {
    try {
      const [members, packages] = await Promise.all([
        membersService.getExpiringMembers(7),
        packagesService.getAll(),
      ]);

      // Attach package info to members
      const membersWithPackages = members.map(member => ({
        ...member,
        gym_packages: packages.find(p => p.id === member.package_id) || null,
      }));

      setExpiringMembers(membersWithPackages);
    } catch (error) {
      console.error("Failed to fetch expiring members:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 1) return "bg-destructive/20 text-destructive border-destructive/50";
    if (days <= 3) return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
  };

  const sendWhatsAppReminder = async (member: MemberWithPackage) => {
    setSendingTo(member.id);
    try {
      const daysLeft = getDaysRemaining(member.package_end_date!);
      const message = `Hi ${member.full_name}! 🏋️\n\nYour Real Fitness membership expires ${daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`} (${format(new Date(member.package_end_date!), "MMM dd, yyyy")}).\n\nRenew now to continue your fitness journey! 💪\n\nContact us or visit the gym to renew.\n\n- Real Fitness Team`;
      
      // Format phone number for WhatsApp (remove spaces, add country code if needed)
      const phone = member.phone.replace(/\s+/g, "").replace(/^0/, "91");
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, "_blank");
      
      // Mark as sent
      setExpiringMembers(prev => 
        prev.map(m => m.id === member.id ? { ...m, notificationSent: true } : m)
      );
      
      toast.success(`Reminder opened for ${member.full_name}`);
    } catch (error) {
      toast.error("Failed to send reminder");
    } finally {
      setSendingTo(null);
    }
  };

  const sendAllReminders = async () => {
    setSendingAll(true);
    const unsent = expiringMembers.filter(m => !m.notificationSent);
    
    for (const member of unsent) {
      await sendWhatsAppReminder(member);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between opens
    }
    
    setSendingAll(false);
    toast.success(`Opened reminders for ${unsent.length} members`);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Loading notifications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Expiring Memberships (Next 7 Days)
        </CardTitle>
        {expiringMembers.length > 0 && (
          <Button
            onClick={sendAllReminders}
            disabled={sendingAll || expiringMembers.every(m => m.notificationSent)}
            className="gap-2"
            size="sm"
          >
            {sendingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send All Reminders
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {expiringMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No memberships expiring in the next 7 days</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {expiringMembers.length} member{expiringMembers.length !== 1 ? "s" : ""} with expiring memberships
            </div>
            {expiringMembers.map((member) => {
              const daysRemaining = getDaysRemaining(member.package_end_date!);
              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-lg border ${getUrgencyColor(daysRemaining)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.full_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-current"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-lg font-bold">
                            {member.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-bold">{member.full_name}</div>
                        <div className="text-sm opacity-80 font-mono">{member.member_id}</div>
                        {member.gym_packages && (
                          <div className="text-xs opacity-70">{member.gym_packages.name}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {daysRemaining === 0 ? "Today" : daysRemaining === 1 ? "Tomorrow" : `${daysRemaining} days`}
                      </div>
                      <div className="text-sm opacity-80">
                        Expires: {format(new Date(member.package_end_date!), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={member.notificationSent ? "outline" : "default"}
                      onClick={() => sendWhatsAppReminder(member)}
                      disabled={sendingTo === member.id}
                      className="gap-1"
                    >
                      {sendingTo === member.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : member.notificationSent ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      {member.notificationSent ? "Sent" : "Remind"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpiryNotifications;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cake, Send, CheckCircle2, Loader2 } from "lucide-react";
import { format, differenceInDays, setYear, startOfDay } from "date-fns";
import { toast } from "sonner";

interface BirthdayMember {
  id: string;
  member_id: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  photo_url: string | null;
  notificationSent?: boolean;
}

const normalizeIndianPhoneForWhatsApp = (phone: string): string | null => {
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return null;

  const withoutLeadingZeros = digitsOnly.replace(/^0+/, "");

  if (withoutLeadingZeros.length === 10) {
    return `91${withoutLeadingZeros}`;
  }

  if (withoutLeadingZeros.length === 12 && withoutLeadingZeros.startsWith("91")) {
    return withoutLeadingZeros;
  }

  if (withoutLeadingZeros.length > 10) {
    return withoutLeadingZeros;
  }

  return null;
};

const BirthdayNotifications = () => {
  const [birthdayMembers, setBirthdayMembers] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchBirthdayMembers();
  }, []);

  const getNextBirthdayDate = (dob: string) => {
    const today = startOfDay(new Date());
    const currentYearBirthday = startOfDay(setYear(new Date(dob), today.getFullYear()));
    if (currentYearBirthday >= today) {
      return currentYearBirthday;
    }
    return startOfDay(setYear(new Date(dob), today.getFullYear() + 1));
  };

  const fetchBirthdayMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, member_id, full_name, phone, date_of_birth, photo_url")
        .not("date_of_birth", "is", null)
        .eq("is_active", true);

      if (error || !data) {
        setLoading(false);
        return;
      }

      const today = startOfDay(new Date());

      const upcoming = data
        .filter((m) => {
          if (!m.date_of_birth) return false;
          const diff = differenceInDays(getNextBirthdayDate(m.date_of_birth), today);
          return diff >= 0 && diff <= 7;
        })
        .sort((a, b) => {
          const dateA = getNextBirthdayDate(a.date_of_birth!);
          const dateB = getNextBirthdayDate(b.date_of_birth!);
          return dateA.getTime() - dateB.getTime();
        }) as BirthdayMember[];

      setBirthdayMembers(upcoming);
    } catch (error) {
      console.error("Failed to fetch birthday members:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilBirthday = (dob: string) => {
    const today = startOfDay(new Date());
    return differenceInDays(getNextBirthdayDate(dob), today);
  };

  const isBirthdayToday = (dob: string) => {
    const birthday = new Date(dob);
    const today = new Date();
    return birthday.getDate() === today.getDate() && birthday.getMonth() === today.getMonth();
  };

  const sendBirthdayWish = async (member: BirthdayMember) => {
    setSendingTo(member.id);
    try {
      const normalizedPhone = normalizeIndianPhoneForWhatsApp(member.phone);
      if (!normalizedPhone) {
        toast.error(`Invalid phone number for ${member.full_name}. Add valid mobile number with country code.`);
        return;
      }

      const message = `🎂🎉 Happy Birthday, ${member.full_name}! 🎉🎂\n\nWishing you a fantastic birthday from all of us at Real Fitness! 💪🏋️\n\nMay this year bring you great health, strength, and success in your fitness journey!\n\n🎁 Come celebrate with a special birthday workout today!\n\n- Team Real Fitness, Kunnathur`;

      const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      setBirthdayMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, notificationSent: true } : m))
      );
      toast.success(`Birthday wish opened for ${member.full_name}`);
    } catch {
      toast.error("Failed to send birthday wish");
    } finally {
      setSendingTo(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Loading birthdays...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          Upcoming Birthdays (Next 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {birthdayMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cake className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No birthdays in the next 7 days</p>
          </div>
        ) : (
          <div className="space-y-4">
            {birthdayMembers.map((member) => {
              const todayBirthday = isBirthdayToday(member.date_of_birth);
              const daysUntil = getDaysUntilBirthday(member.date_of_birth);
              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-lg border ${
                    todayBirthday
                      ? "bg-primary/15 text-foreground border-primary/40"
                      : "bg-muted/50 text-foreground border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-current" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-lg font-bold">{member.full_name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-bold">{member.full_name}</div>
                        <div className="text-sm opacity-80 font-mono">{member.member_id}</div>
                        <div className="text-xs opacity-70">DOB: {format(new Date(member.date_of_birth), "MMM dd")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-lg">{todayBirthday ? "🎂 Today!" : `${daysUntil} days`}</div>
                      </div>
                      <Button
                        size="sm"
                        variant={member.notificationSent ? "outline" : "default"}
                        onClick={() => sendBirthdayWish(member)}
                        disabled={sendingTo === member.id}
                        className="gap-1"
                      >
                        {sendingTo === member.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : member.notificationSent ? (
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        {member.notificationSent ? "Sent" : "Wish"}
                      </Button>
                    </div>
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

export default BirthdayNotifications;

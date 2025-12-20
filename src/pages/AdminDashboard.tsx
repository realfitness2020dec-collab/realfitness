import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserPlus, LogOut, Package, Calendar } from "lucide-react";
import realFitnessLogo from "@/assets/real-fitness-logo.png";
import type { Tables } from "@/integrations/supabase/types";

type GymPackage = Tables<"gym_packages">;
type Member = Tables<"members">;

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "", phone: "", email: "", address: "", weight: "", height: "", package_id: "",
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/admin");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => { fetchPackages(); fetchMembers(); }, []);

  const fetchPackages = async () => {
    const { data } = await supabase.from("gym_packages").select("*").eq("is_active", true);
    if (data) setPackages(data);
  };

  const fetchMembers = async () => {
    const { data } = await supabase.from("members").select("*, gym_packages(name)").order("created_at", { ascending: false });
    if (data) setMembers(data as Member[]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const fileName = `${Date.now()}.${photoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from("member-photos").upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from("member-photos").getPublicUrl(fileName).data.publicUrl;
      }
      const { data: memberIdData, error: memberIdError } = await supabase.rpc("generate_member_id");
      if (memberIdError) throw memberIdError;
      const selectedPackage = packages.find(p => p.id === formData.package_id);
      const startDate = new Date();
      const endDate = new Date();
      if (selectedPackage) endDate.setMonth(endDate.getMonth() + selectedPackage.duration_months);

      const { error: insertError } = await supabase.from("members").insert({
        member_id: memberIdData, full_name: formData.full_name, phone: formData.phone,
        email: formData.email || null, address: formData.address || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        package_id: formData.package_id || null,
        package_start_date: formData.package_id ? startDate.toISOString().split('T')[0] : null,
        package_end_date: formData.package_id ? endDate.toISOString().split('T')[0] : null,
        photo_url: photoUrl,
      });
      if (insertError) throw insertError;
      toast.success(`Member created! ID: ${memberIdData}`);
      setFormData({ full_name: "", phone: "", email: "", address: "", weight: "", height: "", package_id: "" });
      setPhotoFile(null); setPhotoPreview(null); setShowAddMember(false); fetchMembers();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create member");
    } finally { setSubmitting(false); }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={realFitnessLogo} alt="Real Fitness" className="h-16 w-16 object-contain" />
            <div><h1 className="text-xl font-bold text-foreground">REAL FITNESS</h1><p className="text-sm text-muted-foreground">Admin Dashboard</p></div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2"><LogOut className="h-4 w-4" />Sign Out</Button>
        </div>
      </header>
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex justify-center mb-8"><img src={realFitnessLogo} alt="Real Fitness Logo" className="h-48 w-48 object-contain" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle><Users className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{members.length}</div></CardContent></Card>
          <Card className="bg-card border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Packages</CardTitle><Package className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{packages.length}</div></CardContent></Card>
          <Card className="bg-card border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle><Calendar className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{members.filter(m => m.is_active).length}</div></CardContent></Card>
        </div>
        <div className="flex justify-center"><Button onClick={() => setShowAddMember(!showAddMember)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" size="lg"><UserPlus className="h-5 w-5" />Add New Member</Button></div>
        {showAddMember && (
          <Card className="bg-card border-border"><CardHeader><CardTitle className="text-foreground flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" />Add New Member</CardTitle></CardHeader>
            <CardContent><form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                {photoPreview ? <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-primary" /> : <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border"><Users className="h-12 w-12 text-muted-foreground" /></div>}
                <Label htmlFor="photo" className="cursor-pointer text-primary hover:text-primary/80">Upload Photo</Label>
                <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-foreground">Full Name *</Label><Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label className="text-foreground">Phone *</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label className="text-foreground">Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label className="text-foreground">Package</Label><Select value={formData.package_id} onValueChange={(v) => setFormData({...formData, package_id: v})}><SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Choose package" /></SelectTrigger><SelectContent className="bg-popover border-border">{packages.map((pkg) => <SelectItem key={pkg.id} value={pkg.id}>{pkg.name} - ₹{pkg.price}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-foreground">Weight (kg)</Label><Input type="number" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label className="text-foreground">Height (cm)</Label><Input type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className="bg-background border-border text-foreground" /></div>
              </div>
              <div className="space-y-2"><Label className="text-foreground">Address</Label><Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-background border-border text-foreground" /></div>
              <div className="flex gap-4 justify-end"><Button type="button" variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button><Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">{submitting ? "Creating..." : "Create Member"}</Button></div>
            </form></CardContent>
          </Card>
        )}
        <Card className="bg-card border-border"><CardHeader><CardTitle className="text-foreground">Members List</CardTitle></CardHeader>
          <CardContent><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border"><th className="text-left py-3 px-4 text-muted-foreground">Photo</th><th className="text-left py-3 px-4 text-muted-foreground">Member ID</th><th className="text-left py-3 px-4 text-muted-foreground">Name</th><th className="text-left py-3 px-4 text-muted-foreground">Phone</th><th className="text-left py-3 px-4 text-muted-foreground">Status</th></tr></thead>
            <tbody>{members.map((m) => <tr key={m.id} className="border-b border-border hover:bg-muted/50"><td className="py-3 px-4">{m.photo_url ? <img src={m.photo_url} alt={m.full_name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Users className="h-5 w-5 text-muted-foreground" /></div>}</td><td className="py-3 px-4 text-primary font-mono font-bold">{m.member_id}</td><td className="py-3 px-4 text-foreground">{m.full_name}</td><td className="py-3 px-4 text-foreground">{m.phone}</td><td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${m.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{m.is_active ? "Active" : "Inactive"}</span></td></tr>)}
              {members.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No members found</td></tr>}</tbody></table></div></CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
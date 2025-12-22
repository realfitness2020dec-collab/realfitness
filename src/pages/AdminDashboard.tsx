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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, UserPlus, LogOut, Package, Calendar, Pencil, Trash2, Home, QrCode, BarChart3 } from "lucide-react";
import realFitnessLogo from "@/assets/real-fitness-logo.png";
import AttendanceAnalytics from "@/components/AttendanceAnalytics";
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
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "", phone: "", email: "", address: "", weight: "", height: "", package_id: "",
  });

  const [editFormData, setEditFormData] = useState({
    full_name: "", phone: "", email: "", address: "", weight: "", height: "", package_id: "", is_active: true,
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

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditPhotoPreview(reader.result as string);
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

  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setEditFormData({
      full_name: member.full_name,
      phone: member.phone,
      email: member.email || "",
      address: member.address || "",
      weight: member.weight?.toString() || "",
      height: member.height?.toString() || "",
      package_id: member.package_id || "",
      is_active: member.is_active ?? true,
    });
    setEditPhotoPreview(member.photo_url);
    setEditPhotoFile(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSubmitting(true);
    try {
      let photoUrl = editingMember.photo_url;
      if (editPhotoFile) {
        const fileName = `${Date.now()}.${editPhotoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from("member-photos").upload(fileName, editPhotoFile);
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from("member-photos").getPublicUrl(fileName).data.publicUrl;
      }

      const selectedPackage = packages.find(p => p.id === editFormData.package_id);
      const updateData: Record<string, unknown> = {
        full_name: editFormData.full_name,
        phone: editFormData.phone,
        email: editFormData.email || null,
        address: editFormData.address || null,
        weight: editFormData.weight ? parseFloat(editFormData.weight) : null,
        height: editFormData.height ? parseFloat(editFormData.height) : null,
        photo_url: photoUrl,
        is_active: editFormData.is_active,
      };

      if (editFormData.package_id !== editingMember.package_id) {
        updateData.package_id = editFormData.package_id || null;
        if (editFormData.package_id && selectedPackage) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + selectedPackage.duration_months);
          updateData.package_start_date = startDate.toISOString().split('T')[0];
          updateData.package_end_date = endDate.toISOString().split('T')[0];
        }
      }

      const { error } = await supabase.from("members").update(updateData).eq("id", editingMember.id);
      if (error) throw error;
      toast.success("Member updated successfully!");
      setEditingMember(null);
      fetchMembers();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update member");
    } finally { setSubmitting(false); }
  };

  const handleDeleteMember = async (member: Member) => {
    try {
      const { error } = await supabase.from("members").delete().eq("id", member.id);
      if (error) throw error;
      toast.success(`Member ${member.member_id} deleted successfully!`);
      fetchMembers();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete member");
    }
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/checkin")} className="gap-2"><QrCode className="h-4 w-4" />Check-In</Button>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2"><Home className="h-4 w-4" />Home</Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2"><LogOut className="h-4 w-4" />Sign Out</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex justify-center mb-8"><img src={realFitnessLogo} alt="Real Fitness Logo" className="h-48 w-48 object-contain" /></div>
        
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Attendance Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
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
              <CardContent><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border"><th className="text-left py-3 px-4 text-muted-foreground">Photo</th><th className="text-left py-3 px-4 text-muted-foreground">Member ID</th><th className="text-left py-3 px-4 text-muted-foreground">Name</th><th className="text-left py-3 px-4 text-muted-foreground">Phone</th><th className="text-left py-3 px-4 text-muted-foreground">Status</th><th className="text-left py-3 px-4 text-muted-foreground">Actions</th></tr></thead>
                <tbody>{members.map((m) => (
                  <tr key={m.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{m.photo_url ? <img src={m.photo_url} alt={m.full_name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Users className="h-5 w-5 text-muted-foreground" /></div>}</td>
                    <td className="py-3 px-4 text-primary font-mono font-bold">{m.member_id}</td>
                    <td className="py-3 px-4 text-foreground">{m.full_name}</td>
                    <td className="py-3 px-4 text-foreground">{m.phone}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${m.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{m.is_active ? "Active" : "Inactive"}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(m)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle className="text-foreground">Edit Member - {editingMember?.member_id}</DialogTitle></DialogHeader>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                              <div className="flex flex-col items-center gap-4">
                                {editPhotoPreview ? <img src={editPhotoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-primary" /> : <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-border"><Users className="h-8 w-8 text-muted-foreground" /></div>}
                                <Label htmlFor="editPhoto" className="cursor-pointer text-primary hover:text-primary/80 text-sm">Change Photo</Label>
                                <Input id="editPhoto" type="file" accept="image/*" onChange={handleEditPhotoChange} className="hidden" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="text-foreground">Full Name *</Label><Input value={editFormData.full_name} onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})} required className="bg-background border-border text-foreground" /></div>
                                <div className="space-y-2"><Label className="text-foreground">Phone *</Label><Input value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} required className="bg-background border-border text-foreground" /></div>
                                <div className="space-y-2"><Label className="text-foreground">Email</Label><Input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="bg-background border-border text-foreground" /></div>
                                <div className="space-y-2"><Label className="text-foreground">Package</Label><Select value={editFormData.package_id} onValueChange={(v) => setEditFormData({...editFormData, package_id: v})}><SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Choose package" /></SelectTrigger><SelectContent className="bg-popover border-border">{packages.map((pkg) => <SelectItem key={pkg.id} value={pkg.id}>{pkg.name} - ₹{pkg.price}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label className="text-foreground">Weight (kg)</Label><Input type="number" value={editFormData.weight} onChange={(e) => setEditFormData({...editFormData, weight: e.target.value})} className="bg-background border-border text-foreground" /></div>
                                <div className="space-y-2"><Label className="text-foreground">Height (cm)</Label><Input type="number" value={editFormData.height} onChange={(e) => setEditFormData({...editFormData, height: e.target.value})} className="bg-background border-border text-foreground" /></div>
                              </div>
                              <div className="space-y-2"><Label className="text-foreground">Address</Label><Textarea value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} className="bg-background border-border text-foreground" /></div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={editFormData.is_active} onChange={(e) => setEditFormData({...editFormData, is_active: e.target.checked})} className="rounded" />
                                <Label htmlFor="is_active" className="text-foreground">Active Member</Label>
                              </div>
                              <div className="flex gap-4 justify-end"><Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">{submitting ? "Saving..." : "Save Changes"}</Button></div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Delete Member?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete {m.full_name} ({m.member_id}). This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMember(m)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                  {members.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No members found</td></tr>}</tbody></table></div></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <AttendanceAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
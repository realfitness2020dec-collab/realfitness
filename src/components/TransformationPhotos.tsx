import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera, Trash2, Calendar, Weight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { membersService, transformationPhotosService } from "@/integrations/firebase/services";
import type { Member, TransformationPhoto } from "@/integrations/firebase/types";

const TransformationPhotos = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [photos, setPhotos] = useState<TransformationPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    photo_date: new Date().toISOString().split('T')[0],
    notes: "",
    weight: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      fetchPhotos(selectedMemberId);
    } else {
      setPhotos([]);
    }
  }, [selectedMemberId]);

  const fetchMembers = async () => {
    const data = await membersService.getAll();
    setMembers(data.filter(m => m.is_active));
  };

  const fetchPhotos = async (memberId: string) => {
    setLoading(true);
    try {
      const data = await transformationPhotosService.getByMemberId(memberId);
      setPhotos(data);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
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

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileName = `transformations/${selectedMemberId}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    return supabase.storage.from("member-photos").getPublicUrl(fileName).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !photoFile) {
      toast.error("Please select a member and upload a photo");
      return;
    }

    setUploading(true);
    try {
      const photoUrl = await uploadPhoto(photoFile);
      
      await transformationPhotosService.create({
        member_id: selectedMemberId,
        photo_url: photoUrl,
        photo_date: formData.photo_date,
        notes: formData.notes || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      });

      toast.success("Transformation photo uploaded successfully!");
      setDialogOpen(false);
      setFormData({ photo_date: new Date().toISOString().split('T')[0], notes: "", weight: "" });
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchPhotos(selectedMemberId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await transformationPhotosService.delete(photoId);
      toast.success("Photo deleted successfully!");
      fetchPhotos(selectedMemberId);
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Member Transformation Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-foreground">Select Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.member_id} - {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedMemberId && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Camera className="h-4 w-4" />
                    Add Photo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">
                      Upload Transformation Photo - {selectedMember?.full_name}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-48 h-48 object-cover rounded-lg border-2 border-primary" />
                      ) : (
                        <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                          <Camera className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <Label htmlFor="transformPhoto" className="cursor-pointer text-primary hover:text-primary/80">
                        {photoPreview ? "Change Photo" : "Upload Photo *"}
                      </Label>
                      <Input 
                        id="transformPhoto" 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange} 
                        className="hidden" 
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" /> Photo Date
                        </Label>
                        <Input 
                          type="date" 
                          value={formData.photo_date}
                          onChange={(e) => setFormData({...formData, photo_date: e.target.value})}
                          className="bg-background border-border text-foreground"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground flex items-center gap-1">
                          <Weight className="h-4 w-4" /> Weight (kg)
                        </Label>
                        <Input 
                          type="number" 
                          step="0.1"
                          value={formData.weight}
                          onChange={(e) => setFormData({...formData, weight: e.target.value})}
                          placeholder="Optional"
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-foreground">Notes</Label>
                      <Textarea 
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Progress notes, observations..."
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    
                    <div className="flex gap-4 justify-end">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={uploading || !photoFile}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {uploading ? "Uploading..." : "Save Photo"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {selectedMemberId && (
            <div className="mt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading photos...</div>
              ) : photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transformation photos yet. Click "Add Photo" to upload the first one.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <Card key={photo.id} className="bg-muted/50 border-border overflow-hidden">
                      <div className="relative aspect-square">
                        <img 
                          src={photo.photo_url} 
                          alt={`Transformation ${photo.photo_date}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-foreground">
                          {new Date(photo.photo_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        {photo.weight && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Weight: {photo.weight} kg
                          </p>
                        )}
                        {photo.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {photo.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransformationPhotos;

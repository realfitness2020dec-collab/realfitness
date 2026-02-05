import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Camera, Trash2, Calendar, Weight, ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { membersService, transformationPhotosService } from "@/services/supabase";
import type { Member, TransformationPhoto } from "@/services/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TransformationPhotos = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [photos, setPhotos] = useState<TransformationPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<TransformationPhoto | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<TransformationPhoto | null>(null);
  
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
      setBeforePhoto(null);
      setAfterPhoto(null);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    // Auto-select first and last photos for comparison
    if (photos.length >= 2) {
      setBeforePhoto(photos[0]);
      setAfterPhoto(photos[photos.length - 1]);
    } else if (photos.length === 1) {
      setBeforePhoto(photos[0]);
      setAfterPhoto(null);
    } else {
      setBeforePhoto(null);
      setAfterPhoto(null);
    }
  }, [photos]);

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

  // Weight chart data
  const weightChartData = photos
    .filter(p => p.weight)
    .map(p => ({
      date: new Date(p.photo_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      weight: p.weight,
      fullDate: p.photo_date,
    }));

  const weightChange = weightChartData.length >= 2 
    ? (weightChartData[weightChartData.length - 1].weight! - weightChartData[0].weight!).toFixed(1)
    : null;

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
            <Tabs defaultValue="gallery" className="mt-6">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="compare">Compare</TabsTrigger>
                <TabsTrigger value="progress">Weight Chart</TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="mt-4">
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
              </TabsContent>

              <TabsContent value="compare" className="mt-4">
                {photos.length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Upload at least 2 photos to compare before/after.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Before Photo</Label>
                        <Select 
                          value={beforePhoto?.id || ""} 
                          onValueChange={(id) => setBeforePhoto(photos.find(p => p.id === id) || null)}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Select before" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {photos.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {new Date(p.photo_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">After Photo</Label>
                        <Select 
                          value={afterPhoto?.id || ""} 
                          onValueChange={(id) => setAfterPhoto(photos.find(p => p.id === id) || null)}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Select after" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {photos.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {new Date(p.photo_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Before */}
                      <Card className="bg-muted/50 border-border overflow-hidden">
                        <div className="relative">
                          <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 rounded text-xs font-medium text-foreground">
                            BEFORE
                          </div>
                          {beforePhoto ? (
                            <img 
                              src={beforePhoto.photo_url} 
                              alt="Before"
                              className="w-full aspect-[3/4] object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                              <p className="text-muted-foreground">Select photo</p>
                            </div>
                          )}
                        </div>
                        {beforePhoto && (
                          <CardContent className="p-3 text-center">
                            <p className="text-sm font-medium text-foreground">
                              {new Date(beforePhoto.photo_date).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                            {beforePhoto.weight && (
                              <p className="text-lg font-bold text-primary">{beforePhoto.weight} kg</p>
                            )}
                          </CardContent>
                        )}
                      </Card>

                      {/* After */}
                      <Card className="bg-muted/50 border-border overflow-hidden">
                        <div className="relative">
                          <div className="absolute top-2 left-2 bg-primary/80 px-2 py-1 rounded text-xs font-medium text-primary-foreground">
                            AFTER
                          </div>
                          {afterPhoto ? (
                            <img 
                              src={afterPhoto.photo_url} 
                              alt="After"
                              className="w-full aspect-[3/4] object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                              <p className="text-muted-foreground">Select photo</p>
                            </div>
                          )}
                        </div>
                        {afterPhoto && (
                          <CardContent className="p-3 text-center">
                            <p className="text-sm font-medium text-foreground">
                              {new Date(afterPhoto.photo_date).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                            {afterPhoto.weight && (
                              <p className="text-lg font-bold text-primary">{afterPhoto.weight} kg</p>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    </div>

                    {/* Weight change summary */}
                    {beforePhoto?.weight && afterPhoto?.weight && (
                      <Card className="bg-card border-border">
                        <CardContent className="py-4 flex items-center justify-center gap-4">
                          <ArrowLeftRight className="h-5 w-5 text-primary" />
                          <span className="text-foreground">Weight Change:</span>
                          <span className={`text-xl font-bold flex items-center gap-1 ${
                            afterPhoto.weight < beforePhoto.weight ? "text-green-400" : "text-red-400"
                          }`}>
                            {afterPhoto.weight < beforePhoto.weight ? (
                              <TrendingDown className="h-5 w-5" />
                            ) : (
                              <TrendingUp className="h-5 w-5" />
                            )}
                            {(afterPhoto.weight - beforePhoto.weight).toFixed(1)} kg
                          </span>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="progress" className="mt-4">
                {weightChartData.length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Add at least 2 photos with weight data to see the progress chart.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Card */}
                    <Card className="bg-card border-border">
                      <CardContent className="py-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Start Weight</p>
                            <p className="text-xl font-bold text-foreground">{weightChartData[0].weight} kg</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Weight</p>
                            <p className="text-xl font-bold text-foreground">
                              {weightChartData[weightChartData.length - 1].weight} kg
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Change</p>
                            <p className={`text-xl font-bold flex items-center justify-center gap-1 ${
                              parseFloat(weightChange!) < 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              {parseFloat(weightChange!) < 0 ? (
                                <TrendingDown className="h-5 w-5" />
                              ) : (
                                <TrendingUp className="h-5 w-5" />
                              )}
                              {weightChange} kg
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chart */}
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground text-sm">Weight Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weightChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                              />
                              <YAxis 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                domain={['dataMin - 2', 'dataMax + 2']}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  color: 'hsl(var(--foreground))'
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="weight" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={3}
                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransformationPhotos;

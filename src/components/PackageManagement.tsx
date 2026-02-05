import { useEffect, useState } from "react";
import { packagesService } from "@/services/supabase";
import type { GymPackage } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2, IndianRupee, Clock } from "lucide-react";

const PackageManagement = () => {
  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<GymPackage | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_months: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const data = await packagesService.getAll();
      setPackages(data);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration_months: "",
      is_active: true,
    });
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.duration_months) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await packagesService.create({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        is_active: formData.is_active,
      });

      toast.success("Package created successfully!");
      resetForm();
      setShowAddForm(false);
      fetchPackages();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create package");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (pkg: GymPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price.toString(),
      duration_months: pkg.duration_months.toString(),
      is_active: pkg.is_active ?? true,
    });
  };

  const handleEditPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    setSubmitting(true);
    try {
      await packagesService.update(editingPackage.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        is_active: formData.is_active,
      });

      toast.success("Package updated successfully!");
      setEditingPackage(null);
      resetForm();
      fetchPackages();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update package");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = async (pkg: GymPackage) => {
    try {
      await packagesService.delete(pkg.id);
      toast.success(`Package "${pkg.name}" deleted successfully!`);
      fetchPackages();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete package");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading packages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{packages.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Packages</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{packages.filter(p => p.is_active).length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{packages.filter(p => !p.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Package Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => { resetForm(); setShowAddForm(!showAddForm); }} 
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" 
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Add New Package
        </Button>
      </div>

      {/* Add Package Form */}
      {showAddForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Package
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Package Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Basic"
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Price (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 1500"
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Duration (Months) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                    placeholder="e.g., 1"
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2 flex items-center gap-4 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label className="text-foreground">Active</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Package features and benefits..."
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => { resetForm(); setShowAddForm(false); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {submitting ? "Creating..." : "Create Package"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Packages List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Packages List</CardTitle>
        </CardHeader>
        <CardContent>
          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={`bg-muted/30 border ${pkg.is_active ? "border-primary/50" : "border-border opacity-60"}`}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${pkg.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {pkg.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary flex items-center">
                            <IndianRupee className="h-5 w-5" />
                            {pkg.price}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{pkg.duration_months} {pkg.duration_months === 1 ? "Month" : "Months"}</span>
                      </div>

                      {pkg.description && (
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(pkg)} className="flex-1 gap-2">
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">Edit Package</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEditPackage} className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-foreground">Package Name *</Label>
                                <Input
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  required
                                  className="bg-background border-border text-foreground"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-foreground">Price (₹) *</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    className="bg-background border-border text-foreground"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-foreground">Duration (Months) *</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={formData.duration_months}
                                    onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                                    required
                                    className="bg-background border-border text-foreground"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-foreground">Description</Label>
                                <Textarea
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  className="bg-background border-border text-foreground"
                                />
                              </div>
                              <div className="flex items-center gap-4">
                                <Switch
                                  checked={formData.is_active}
                                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label className="text-foreground">Active</Label>
                              </div>
                              <div className="flex gap-4 justify-end">
                                <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                  {submitting ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Delete Package?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{pkg.name}". Members using this package will not be affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePackage(pkg)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No packages created yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageManagement;

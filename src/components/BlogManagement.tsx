import { useEffect, useState } from "react";
import { blogService, storageService, BlogPost, BlogCategory } from "@/services/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Plus, Pencil, Trash2, Eye, EyeOff, Star, Image } from "lucide-react";

const BlogManagement = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category_id: "",
    tags: "",
    is_featured: false,
    is_published: false,
    meta_title: "",
    meta_description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsData, categoriesData] = await Promise.all([
        blogService.getAllPosts(),
        blogService.getCategories(),
      ]);
      setPosts(postsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching blog data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category_id: "",
      tags: "",
      is_featured: false,
      is_published: false,
      meta_title: "",
      meta_description: "",
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
      meta_title: title.substring(0, 60),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create posts");
      return;
    }

    setSubmitting(true);
    try {
      let featuredImage = null;
      if (imageFile) {
        featuredImage = await storageService.uploadBlogImage(imageFile);
      }

      await blogService.createPost({
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: formData.content,
        featured_image: featuredImage,
        category_id: formData.category_id || null,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        author_id: user.id,
        published_at: formData.is_published ? new Date().toISOString() : null,
      });

      toast.success("Blog post created successfully!");
      resetForm();
      setShowAddForm(false);
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      category_id: post.category_id || "",
      tags: post.tags?.join(", ") || "",
      is_featured: post.is_featured,
      is_published: post.is_published,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
    });
    setImagePreview(post.featured_image);
    setImageFile(null);
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    setSubmitting(true);
    try {
      let featuredImage = editingPost.featured_image;
      if (imageFile) {
        featuredImage = await storageService.uploadBlogImage(imageFile);
      }

      await blogService.updatePost(editingPost.id, {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: formData.content,
        featured_image: featuredImage,
        category_id: formData.category_id || null,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        published_at: formData.is_published && !editingPost.published_at 
          ? new Date().toISOString() 
          : editingPost.published_at,
      });

      toast.success("Blog post updated successfully!");
      setEditingPost(null);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    try {
      await blogService.deletePost(post.id);
      toast.success("Post deleted successfully!");
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete post");
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await blogService.updatePost(post.id, {
        is_published: !post.is_published,
        published_at: !post.is_published ? new Date().toISOString() : post.published_at,
      });
      toast.success(post.is_published ? "Post unpublished" : "Post published!");
      fetchData();
    } catch (error) {
      toast.error("Failed to update post");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{posts.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{posts.filter(p => p.is_published).length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{posts.filter(p => !p.is_published).length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{posts.filter(p => p.is_featured).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Create New Post
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Blog Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPost} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter post title"
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">URL Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-slug"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Category</Label>
                  <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="fitness, workout, tips"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Excerpt</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value, meta_description: e.target.value.substring(0, 160) })}
                  placeholder="Brief summary of the post..."
                  className="bg-background border-border text-foreground"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your blog content here..."
                  className="bg-background border-border text-foreground min-h-[200px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Featured Image</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-32 h-20 object-cover rounded border border-border" />
                  ) : (
                    <div className="w-32 h-20 bg-muted rounded border border-border flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="blogImage" className="cursor-pointer text-primary hover:text-primary/80">
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </Label>
                    <Input id="blogImage" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label className="text-foreground">Publish immediately</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label className="text-foreground">Featured post</Label>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => { resetForm(); setShowAddForm(false); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {submitting ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    {post.featured_image ? (
                      <img src={post.featured_image} alt={post.title} className="w-16 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-foreground">{post.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {post.blog_categories && (
                          <Badge variant="secondary">{post.blog_categories.name}</Badge>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${post.is_published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {post.is_published ? "Published" : "Draft"}
                        </span>
                        {post.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(post)}>
                      {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(post)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Edit Post</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditPost} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-foreground">Title *</Label>
                              <Input
                                value={formData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                required
                                className="bg-background border-border text-foreground"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-foreground">Category</Label>
                              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                                <SelectTrigger className="bg-background border-border text-foreground">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-foreground">Content *</Label>
                            <Textarea
                              value={formData.content}
                              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                              className="bg-background border-border text-foreground min-h-[150px]"
                              required
                            />
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={formData.is_published}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                              />
                              <Label className="text-foreground">Published</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={formData.is_featured}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                              />
                              <Label className="text-foreground">Featured</Label>
                            </div>
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
                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Delete Post?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{post.title}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePost(post)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No blog posts yet. Create your first post!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogManagement;

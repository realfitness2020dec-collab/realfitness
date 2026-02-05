import { useEffect, useState } from "react";
import { blogService, BlogPost } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, ArrowRight, Star, X } from "lucide-react";
import { format } from "date-fns";

const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const [allPosts, featured] = await Promise.all([
        blogService.getPublishedPosts(6),
        blogService.getFeaturedPosts(),
      ]);
      setPosts(allPosts);
      setFeaturedPosts(featured);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground">Loading blog posts...</div>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Latest from Our Blog
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tips, news, and stories to keep you motivated on your fitness journey
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="text-xl font-semibold text-foreground">Featured</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="bg-card border-primary/20 border-2 overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                  onClick={() => setSelectedPost(post)}
                >
                  {post.featured_image ? (
                    <img 
                      src={post.featured_image} 
                      alt={post.title} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Star className="h-12 w-12 text-primary/50" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    {post.blog_categories && (
                      <Badge variant="secondary" className="mb-2">{post.blog_categories.name}</Badge>
                    )}
                    <h4 className="font-bold text-foreground line-clamp-2 mb-2">{post.title}</h4>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {post.published_at && format(new Date(post.published_at), "MMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.filter(p => !featuredPosts.some(f => f.id === p.id)).map((post) => (
            <Card 
              key={post.id} 
              className="bg-card border-border overflow-hidden cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => setSelectedPost(post)}
            >
              {post.featured_image ? (
                <img 
                  src={post.featured_image} 
                  alt={post.title} 
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-muted to-muted/50" />
              )}
              <CardContent className="p-4">
                {post.blog_categories && (
                  <Badge variant="outline" className="mb-2">{post.blog_categories.name}</Badge>
                )}
                <h4 className="font-bold text-foreground line-clamp-2 mb-2">{post.title}</h4>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {post.published_at && format(new Date(post.published_at), "MMM d, yyyy")}
                  </span>
                  <span className="text-primary text-sm flex items-center gap-1 hover:underline">
                    Read more <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tags */}
        {posts.some(p => p.tags && p.tags.length > 0) && (
          <div className="mt-12 text-center">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Popular Topics</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from(new Set(posts.flatMap(p => p.tags || []))).slice(0, 10).map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                {selectedPost?.blog_categories && (
                  <Badge variant="secondary" className="mb-2">{selectedPost.blog_categories.name}</Badge>
                )}
                <DialogTitle className="text-2xl text-foreground">{selectedPost?.title}</DialogTitle>
                {selectedPost?.published_at && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(selectedPost.published_at), "MMMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {selectedPost?.featured_image && (
            <img 
              src={selectedPost.featured_image} 
              alt={selectedPost.title} 
              className="w-full h-64 object-cover rounded-lg my-4"
            />
          )}
          
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {selectedPost?.content}
            </div>
          </div>

          {selectedPost?.tags && selectedPost.tags.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {selectedPost.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => setSelectedPost(null)}
            className="mt-4"
          >
            <X className="h-4 w-4 mr-2" /> Close
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default BlogSection;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  name: string;
  message: string;
  rating: number;
  created_at: string;
}

const FeedbackSection = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setFeedbacks(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("feedback")
      .insert({ name: name.trim(), message: message.trim(), rating });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit", variant: "destructive" });
    } else {
      toast({ title: "Thank you for your feedback! 💪" });
      setName("");
      setMessage("");
      setRating(5);
      fetchFeedbacks();
    }
  };

  return (
    <section className="py-16 px-4 bg-muted/30" id="feedback">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            <MessageSquare className="inline-block mr-2 mb-1" />
            What Our Members Say
          </h2>
          <p className="text-muted-foreground">Share your experience with Real Fitness</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Submit Form */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Leave Your Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
                <Textarea
                  placeholder="Write your feedback..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={4}
                  required
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground mr-2">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 cursor-pointer transition-colors ${
                        star <= (hoveredStar || rating)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Display Feedbacks */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {feedbacks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Be the first to leave feedback!
              </p>
            ) : (
              feedbacks.map((fb) => (
                <Card key={fb.id} className="border-border/50">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{fb.name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= fb.rating
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{fb.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeedbackSection;

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const motivationalQuotes = [
  { quote: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { quote: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
  { quote: "Success is what comes after you stop making excuses.", author: "Luis Galarza" },
  { quote: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { quote: "Don't limit your challenges. Challenge your limits.", author: "Unknown" },
  { quote: "Sweat is just fat crying.", author: "Unknown" },
  { quote: "Fitness is not about being better than someone else. It's about being better than you used to be.", author: "Unknown" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { quote: "Your health is an investment, not an expense.", author: "Unknown" },
  { quote: "The harder you work, the luckier you get.", author: "Gary Player" },
  { quote: "Train insane or remain the same.", author: "Unknown" },
  { quote: "A one-hour workout is 4% of your day. No excuses.", author: "Unknown" },
  { quote: "The body achieves what the mind believes.", author: "Unknown" },
  { quote: "Sore today, strong tomorrow.", author: "Unknown" },
  { quote: "When you feel like quitting, think about why you started.", author: "Unknown" },
  { quote: "Champions are made when no one is watching.", author: "Unknown" },
  { quote: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { quote: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
  { quote: "The difference between try and triumph is a little umph.", author: "Marvin Phillips" },
];

const DailyMotivation = () => {
  const [currentQuote, setCurrentQuote] = useState({ quote: "", author: "" });

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setCurrentQuote(motivationalQuotes[randomIndex]);
  };

  useEffect(() => {
    // Get a quote based on the day to have consistency
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % motivationalQuotes.length;
    setCurrentQuote(motivationalQuotes[quoteIndex]);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/20">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
              Daily Motivation 💪
            </p>
            <blockquote className="text-lg text-foreground font-medium italic">
              "{currentQuote.quote}"
            </blockquote>
            <p className="text-sm text-muted-foreground mt-2">
              — {currentQuote.author}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={getRandomQuote}
            className="text-primary hover:text-primary/80"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyMotivation;

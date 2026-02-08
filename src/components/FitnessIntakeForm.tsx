import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck } from "lucide-react";

interface FitnessIntakeFormProps {
  memberName: string;
  onSubmit: (data: {
    fitness_goal: string;
    alcohol_consumption: boolean;
    diet_type: string;
    physical_issues: string;
    activity_level: string;
  }) => void;
  isSubmitting: boolean;
}

const FitnessIntakeForm = ({ memberName, onSubmit, isSubmitting }: FitnessIntakeFormProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    fitness_goal: "",
    alcohol_consumption: false,
    diet_type: "",
    physical_issues: "",
    activity_level: "",
  });

  const questions = [
    {
      key: "fitness_goal",
      question: `Hey ${memberName}! 💪 Welcome to Real Fitness! Let's set up your personal workout plan. What's your main goal?`,
      options: [
        { label: "🔥 Weight Loss", value: "weight_loss" },
        { label: "💪 Weight Gain / Muscle Build", value: "weight_gain" },
        { label: "⚖️ Stay Fit / Maintain", value: "maintenance" },
      ],
    },
    {
      key: "diet_type",
      question: "Are you vegetarian or non-vegetarian? 🍗🥗",
      options: [
        { label: "🥗 Vegetarian", value: "veg" },
        { label: "🍗 Non-Vegetarian", value: "non_veg" },
      ],
    },
    {
      key: "alcohol_consumption",
      question: "Do you consume alcohol? 🍺",
      options: [
        { label: "❌ No", value: "false" },
        { label: "✅ Yes", value: "true" },
      ],
    },
    {
      key: "activity_level",
      question: "How active are you in daily life? 🏃",
      options: [
        { label: "🏃 Active (sports/physical work)", value: "active" },
        { label: "🚶 Moderate (some walking/light activity)", value: "moderate" },
        { label: "🛋️ Sedentary (mostly sitting/lazy)", value: "lazy" },
      ],
    },
    {
      key: "physical_issues",
      question: "Do you have any body pain, injuries, or physical illness? 🏥",
      isTextInput: true,
      placeholder: "E.g., back pain, knee injury, asthma... (type 'none' if nothing)",
    },
  ];

  const currentQ = questions[step];

  const handleOptionSelect = (value: string) => {
    const key = currentQ.key as keyof typeof answers;
    if (key === "alcohol_consumption") {
      setAnswers((prev) => ({ ...prev, [key]: value === "true" }));
    } else {
      setAnswers((prev) => ({ ...prev, [key]: value }));
    }

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onSubmit(answers);
    }
  };

  const handleTextSubmit = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onSubmit(answers);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Quick Fitness Profile Setup
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {questions.length}
        </p>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground font-medium text-lg">{currentQ.question}</p>

        {currentQ.isTextInput ? (
          <div className="space-y-3">
            <Textarea
              value={answers.physical_issues}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, physical_issues: e.target.value }))
              }
              placeholder={currentQ.placeholder}
              className="bg-background border-border text-foreground"
            />
            <Button
              onClick={handleTextSubmit}
              disabled={!answers.physical_issues.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Saving..." : step === questions.length - 1 ? "🚀 Start My Journey!" : "Next →"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {currentQ.options?.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                className="w-full text-left justify-start py-4 text-base hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => handleOptionSelect(opt.value)}
                disabled={isSubmitting}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FitnessIntakeForm;

import { useState } from "react";
import { UserCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ArticleFormData, PersonaAnalysis } from "@/types/article";

interface StepPersonaProps {
  onComplete: (data: ArticleFormData) => void;
  onPrevious: () => void;
  isLoading: boolean;
  initialData?: ArticleFormData;
  personaAnalysis?: PersonaAnalysis;
}

export function StepPersona({ onComplete, onPrevious, isLoading, initialData, personaAnalysis }: StepPersonaProps) {
  const [formData, setFormData] = useState<ArticleFormData>({
    targetKeyword: initialData?.targetKeyword || "",
    industry: initialData?.industry || "Technology",
    contentType: initialData?.contentType || "comparison",
    additionalContext: initialData?.additionalContext || "",
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.targetKeyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target keyword",
        variant: "destructive",
      });
      return;
    }

    onComplete(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <UserCheck className="text-white w-4 h-4" />
          </div>
          <CardTitle>Step 2: Persona & Intent Analysis</CardTitle>
        </div>
        <p className="text-slate-600 text-sm">
          Define your target audience and understand their search intent based on competitor analysis.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="targetKeyword">Target Keyword</Label>
            <Input
              id="targetKeyword"
              value={formData.targetKeyword}
              onChange={(e) => setFormData({ ...formData, targetKeyword: e.target.value })}
              placeholder="e.g., best project management tools"
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="industry">Business/Industry</Label>
            <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Content Type</Label>
            <RadioGroup 
              value={formData.contentType} 
              onValueChange={(value) => setFormData({ ...formData, contentType: value })}
              className="mt-2"
            >
              <div className="grid grid-cols-2 gap-3">
                <Label className="flex items-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="comparison" className="text-brand-500" />
                  <span className="ml-2 text-sm">Comparison</span>
                </Label>
                <Label className="flex items-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="guide" className="text-brand-500" />
                  <span className="ml-2 text-sm">How-to Guide</span>
                </Label>
                <Label className="flex items-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="listicle" className="text-brand-500" />
                  <span className="ml-2 text-sm">Listicle</span>
                </Label>
                <Label className="flex items-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="review" className="text-brand-500" />
                  <span className="ml-2 text-sm">Review</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
            <Textarea
              id="additionalContext"
              value={formData.additionalContext}
              onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              placeholder="Any specific requirements or focus areas..."
              className="mt-2"
              rows={3}
            />
          </div>
          
          {personaAnalysis && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
              <h4 className="font-medium text-emerald-900 mb-2">Generated Analysis</h4>
              <div className="space-y-2 text-sm text-emerald-800">
                <p><strong>Target Audience:</strong> {personaAnalysis.targetAudience}</p>
                <p><strong>Search Intent:</strong> {personaAnalysis.searchIntent}</p>
                <p><strong>Tone:</strong> {personaAnalysis.toneSuggestions}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="ghost" onClick={onPrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Analysis"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

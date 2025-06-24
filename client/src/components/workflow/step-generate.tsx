import { Edit, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ContentOutline } from "@/types/article";

interface StepGenerateProps {
  onGenerate: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isLoading: boolean;
  outline?: ContentOutline;
  content?: { [key: string]: string };
  generationProgress?: number;
}

export function StepGenerate({ 
  onGenerate, 
  onPrevious, 
  onNext, 
  isLoading, 
  outline, 
  content,
  generationProgress = 0 
}: StepGenerateProps) {
  const hasContent = content && Object.keys(content).length > 0;
  const totalSections = outline?.sections.length || 0;
  const completedSections = content ? Object.keys(content).length : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Edit className="text-white w-4 h-4" />
          </div>
          <CardTitle>Step 4: Content Generation</CardTitle>
        </div>
        <p className="text-slate-600 text-sm">
          Generate high-quality content for each section of your outline.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading && (
          <div>
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Generating content...</span>
              <span>{completedSections}/{totalSections} sections</span>
            </div>
            <Progress value={generationProgress} className="w-full" />
          </div>
        )}

        {hasContent ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-slate-900">Generated Content</h4>
              <span className="text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                {completedSections} sections completed
              </span>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {outline?.sections.map((section, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <h5 className="font-medium text-slate-900 mb-2">{section.heading}</h5>
                  {content[section.heading] ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="text-slate-600 text-sm">
                        {content[section.heading].substring(0, 200)}...
                      </div>
                      <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mt-2 inline-block">
                        Completed
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm italic">
                      Content will be generated here...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">
              Ready to generate content for all sections in your outline.
            </p>
            <Button onClick={onGenerate} disabled={isLoading || !outline}>
              {isLoading ? "Generating Content..." : "Generate All Content"}
            </Button>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {hasContent && completedSections === totalSections && (
            <Button onClick={onNext}>
              Continue to Finalize
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

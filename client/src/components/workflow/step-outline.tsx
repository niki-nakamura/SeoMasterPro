import { FileText, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentOutline } from "@/types/article";

interface StepOutlineProps {
  onGenerate: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isLoading: boolean;
  outline?: ContentOutline;
}

export function StepOutline({ onGenerate, onPrevious, onNext, isLoading, outline }: StepOutlineProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <FileText className="text-white w-4 h-4" />
          </div>
          <CardTitle>Step 3: Content Outline</CardTitle>
        </div>
        <p className="text-slate-600 text-sm">
          Generate a comprehensive content structure based on your persona analysis.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {outline ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Generated Outline</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-semibold text-lg mb-4">{outline.title}</h5>
                
                <div className="space-y-3">
                  <div>
                    <h6 className="font-medium text-slate-700">Introduction</h6>
                    <p className="text-sm text-slate-600 mt-1">{outline.introduction}</p>
                  </div>
                  
                  <div>
                    <h6 className="font-medium text-slate-700">Main Sections</h6>
                    <ul className="space-y-2 mt-2">
                      {outline.sections.map((section, index) => (
                        <li key={index} className="border-l-2 border-brand-500 pl-3">
                          <p className="font-medium text-slate-900">{section.heading}</p>
                          {section.subheadings.length > 0 && (
                            <ul className="text-sm text-slate-600 mt-1 ml-4">
                              {section.subheadings.map((sub, subIndex) => (
                                <li key={subIndex}>• {sub}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h6 className="font-medium text-slate-700">Conclusion</h6>
                    <p className="text-sm text-slate-600 mt-1">{outline.conclusion}</p>
                  </div>
                  
                  <div className="text-sm text-slate-500 pt-2 border-t">
                    Estimated word count: {outline.estimatedWordCount} words
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">
              Ready to generate your content outline based on the persona analysis.
            </p>
            <Button onClick={onGenerate} disabled={isLoading}>
              {isLoading ? "Generating Outline..." : "Generate Outline"}
            </Button>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {outline && (
            <Button onClick={onNext}>
              Continue to Content Generation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

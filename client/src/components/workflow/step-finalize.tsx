import { CheckCircle, ArrowLeft, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MetaTags, ContentOutline } from "@/types/article";

interface StepFinalizeProps {
  onFinalize: () => void;
  onPrevious: () => void;
  isLoading: boolean;
  outline?: ContentOutline;
  metaTags?: MetaTags;
  finalContent?: string;
  wordCount?: number;
}

export function StepFinalize({ 
  onFinalize, 
  onPrevious, 
  isLoading, 
  outline, 
  metaTags, 
  finalContent,
  wordCount 
}: StepFinalizeProps) {
  const isFinalized = metaTags && finalContent;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <CheckCircle className="text-white w-4 h-4" />
          </div>
          <CardTitle>Step 5: Finalize & Meta Tags</CardTitle>
        </div>
        <p className="text-slate-600 text-sm">
          Generate meta tags and finalize your article for publication.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isFinalized ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h4 className="font-medium text-emerald-900">Article Completed!</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-emerald-700">Title:</span>
                  <p className="font-medium text-emerald-900">{outline?.title}</p>
                </div>
                <div>
                  <span className="text-emerald-700">Word Count:</span>
                  <p className="font-medium text-emerald-900">{wordCount} words</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-3">SEO Meta Tags</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Textarea
                    id="metaTitle"
                    value={metaTags.metaTitle}
                    readOnly
                    className="mt-1 bg-slate-50"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={metaTags.metaDescription}
                    readOnly
                    className="mt-1 bg-slate-50"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Focus Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {metaTags.focusKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-brand-100 text-brand-700 px-2 py-1 rounded-full text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                Preview Article
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">
              Ready to generate meta tags and finalize your article.
            </p>
            <Button onClick={onFinalize} disabled={isLoading}>
              {isLoading ? "Finalizing..." : "Finalize Article"}
            </Button>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {isFinalized && (
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Publish Article
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

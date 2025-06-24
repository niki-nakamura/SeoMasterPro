import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ScrapedResult } from "@/types/article";

interface StepScrapeProps {
  onComplete: (results: ScrapedResult[]) => void;
  onNext: () => void;
  isLoading: boolean;
  results?: ScrapedResult[];
}

export function StepScrape({ onComplete, onNext, isLoading, results }: StepScrapeProps) {
  const [keyword, setKeyword] = useState("");
  const { toast } = useToast();

  const handleScrape = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target keyword",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), maxResults: 8 }),
      });

      if (!response.ok) {
        throw new Error("Scraping failed");
      }

      const data = await response.json();
      onComplete(data.results);
      
      toast({
        title: "Success",
        description: `Found ${data.results.length} competitor articles`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scrape search results. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Search className="text-white w-4 h-4" />
          </div>
          <CardTitle>Step 1: Competitor Analysis</CardTitle>
        </div>
        <p className="text-slate-600 text-sm">
          Enter your target keyword to analyze top-ranking competitor content.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="keyword">Target Keyword</Label>
          <Input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., best project management tools"
            className="mt-2"
          />
        </div>
        
        {results && results.length > 0 && (
          <div>
            <h4 className="font-medium text-slate-900 mb-3">
              Found {results.length} competitor articles
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-4 h-4 bg-slate-300 rounded mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {result.title}
                    </p>
                    <p className="text-xs text-slate-500">{result.domain}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={result.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <div />
          {results && results.length > 0 ? (
            <Button onClick={onNext}>
              Continue to Persona Analysis
            </Button>
          ) : (
            <Button onClick={handleScrape} disabled={isLoading}>
              {isLoading ? "Scraping..." : "Start Scraping"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

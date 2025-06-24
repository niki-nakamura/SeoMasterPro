import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useArticleWorkflow } from "@/hooks/use-article-workflow";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { ProgressSteps } from "@/components/workflow/progress-steps";
import { StepScrape } from "@/components/workflow/step-scrape";
import { StepPersona } from "@/components/workflow/step-persona";
import { StepOutline } from "@/components/workflow/step-outline";
import { StepGenerate } from "@/components/workflow/step-generate";
import { StepFinalize } from "@/components/workflow/step-finalize";
import { useToast } from "@/hooks/use-toast";
import type { ScrapedResult, ArticleFormData } from "@/types/article";

export default function ContentGenerator() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const articleId = params.id ? parseInt(params.id) : undefined;
  const [scrapedResults, setScrapedResults] = useState<ScrapedResult[]>([]);
  const { toast } = useToast();

  const {
    article,
    articleLoading,
    steps,
    currentStep,
    setCurrentStep,
    mutations
  } = useArticleWorkflow(articleId);

  // Handle creating new article if none exists
  useEffect(() => {
    if (!articleId && scrapedResults.length > 0) {
      // Create initial article with basic data
      mutations.createArticle.mutate({
        title: "New Article",
        targetKeyword: "",
        industry: "Technology",
        contentType: "comparison",
        currentStep: 2
      }, {
        onSuccess: (newArticle) => {
          // Save scraped results to the new article
          fetch(`/api/articles/${newArticle.id}/scraped-urls`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ results: scrapedResults }),
          });
          
          // Navigate to the new article
          setLocation(`/content-generator/${newArticle.id}`);
        }
      });
    }
  }, [scrapedResults, articleId, mutations.createArticle, setLocation]);

  const handleScrapeComplete = (results: ScrapedResult[]) => {
    setScrapedResults(results);
    if (articleId) {
      // Update existing article step
      fetch(`/api/articles/${articleId}/scraped-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      setCurrentStep(2);
    }
  };

  const handlePersonaComplete = (formData: ArticleFormData) => {
    if (!articleId) return;
    
    mutations.generatePersona.mutate({
      articleId,
      ...formData
    }, {
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to generate persona analysis",
          variant: "destructive",
        });
      }
    });
  };

  const handleOutlineGenerate = () => {
    if (!articleId) return;
    
    mutations.generateOutline.mutate({ articleId }, {
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to generate outline",
          variant: "destructive",
        });
      }
    });
  };

  const handleContentGenerate = () => {
    if (!articleId) return;
    
    mutations.generateContent.mutate({ articleId }, {
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to generate content",
          variant: "destructive",
        });
      }
    });
  };

  const handleFinalize = () => {
    if (!articleId) return;
    
    mutations.finalize.mutate({ articleId }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Article finalized successfully!",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to finalize article",
          variant: "destructive",
        });
      }
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepScrape
            onComplete={handleScrapeComplete}
            onNext={() => setCurrentStep(2)}
            isLoading={false}
            results={scrapedResults}
          />
        );
      case 2:
        return (
          <StepPersona
            onComplete={handlePersonaComplete}
            onPrevious={() => setCurrentStep(1)}
            isLoading={mutations.generatePersona.isPending}
            initialData={article ? {
              targetKeyword: article.targetKeyword,
              industry: article.industry,
              contentType: article.contentType,
              additionalContext: article.additionalContext || undefined,
            } : undefined}
            personaAnalysis={article?.personaAnalysis as any}
          />
        );
      case 3:
        return (
          <StepOutline
            onGenerate={handleOutlineGenerate}
            onPrevious={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
            isLoading={mutations.generateOutline.isPending}
            outline={article?.outline as any}
          />
        );
      case 4:
        return (
          <StepGenerate
            onGenerate={handleContentGenerate}
            onPrevious={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
            isLoading={mutations.generateContent.isPending}
            outline={article?.outline as any}
            content={article?.content as any}
          />
        );
      case 5:
        return (
          <StepFinalize
            onFinalize={handleFinalize}
            onPrevious={() => setCurrentStep(4)}
            isLoading={mutations.finalize.isPending}
            outline={article?.outline as any}
            metaTags={article?.metaTags as any}
            finalContent={article?.finalContent || undefined}
            wordCount={article?.wordCount || undefined}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="flex pt-16">
        <Sidebar />
        <main className="ml-64 flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">SEO Content Generator</h1>
            <p className="text-slate-600">Create high-quality, SEO-optimized content in 5 simple steps</p>
          </div>

          <ProgressSteps steps={steps} currentStep={currentStep} />

          <div className="max-w-4xl">
            {renderCurrentStep()}
          </div>
        </main>
      </div>
    </div>
  );
}

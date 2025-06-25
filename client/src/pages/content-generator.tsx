import { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { ProgressSteps } from "@/components/workflow/progress-steps";
import { StepScrape } from "@/components/workflow/step-scrape";
import { StepPersona } from "@/components/workflow/step-persona";
import { StepOutline } from "@/components/workflow/step-outline";
import { StepGenerate } from "@/components/workflow/step-generate";
import { StepFinalize } from "@/components/workflow/step-finalize";
import { useToast } from "@/hooks/use-toast";
import type { WorkflowStep, ArticleFormData, ScrapedResult } from "@/types/article";

export default function ContentGenerator() {
  const {
    step,
    data,
    nextStep,
    prevStep,
    setScrapeData,
    setPersonaData,
    setOutlineData,
    setContentData,
    setFinalizeData,
  } = useWorkflowStore();

  const { toast } = useToast();
  
  // Loading states for each step
  const [loadingStates, setLoadingStates] = useState({
    scrape: false,
    persona: false,
    outline: false,
    content: false,
    finalize: false
  });

  const setLoading = (step: keyof typeof loadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [step]: loading }));
  };

  const handleScrape = async (results: ScrapedResult[]) => {
    setScrapeData({ keyword: 'SEO', results });
    nextStep();
  };

  const handlePersonaComplete = async (formData: ArticleFormData) => {
    setLoading('persona', true);
    try {
      const response = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scrapedResults: data.scrapeData?.results || []
        })
      });
      
      if (!response.ok) throw new Error('Persona generation failed');
      
      const analysis = await response.json();
      setPersonaData({ formData, analysis });
      nextStep();
    } catch (error) {
      console.error('Persona generation failed:', error);
      toast({ title: "Error", description: "Failed to generate persona analysis", variant: "destructive" });
    } finally {
      setLoading('persona', false);
    }
  };

  const handleOutlineGenerate = async () => {
    setLoading('outline', true);
    try {
      const response = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data.personaData?.formData,
          personaAnalysis: data.personaData?.analysis,
          scrapedResults: data.scrapeData?.results || []
        })
      });
      
      if (!response.ok) throw new Error('Outline generation failed');
      
      const outline = await response.json();
      setOutlineData({ outline });
      nextStep();
    } catch (error) {
      console.error('Outline generation failed:', error);
      toast({ title: "Error", description: "Failed to generate outline", variant: "destructive" });
    } finally {
      setLoading('outline', false);
    }
  };

  const handleContentGenerate = async () => {
    setLoading('content', true);
    try {
      const sections: { [key: string]: string } = {};
      const outline = data.outlineData?.outline;
      
      if (!outline) throw new Error('No outline available');

      // Generate content for each section
      for (let i = 0; i < outline.sections.length; i++) {
        const section = outline.sections[i];
        const response = await fetch('/api/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data.personaData?.formData,
            outline,
            sectionIndex: i,
            previousSections: sections
          })
        });
        
        if (!response.ok) throw new Error(`Section ${i + 1} generation failed`);
        
        const { content } = await response.json();
        sections[section.heading] = content;
        
        // Update progress
        const progress = ((i + 1) / outline.sections.length) * 100;
        setContentData({ sections, progress });
      }
      
      nextStep();
    } catch (error) {
      console.error('Content generation failed:', error);
      toast({ title: "Error", description: "Failed to generate content", variant: "destructive" });
    } finally {
      setLoading('content', false);
    }
  };

  const handleFinalize = async () => {
    setLoading('finalize', true);
    try {
      const response = await fetch('/api/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data.personaData?.formData,
          outline: data.outlineData?.outline,
          content: data.contentData?.sections
        })
      });
      
      if (!response.ok) throw new Error('Finalization failed');
      
      const result = await response.json();
      setFinalizeData({
        metaTags: result.metaTags,
        finalContent: result.finalContent,
        wordCount: result.wordCount
      });
      
      toast({ title: "Success", description: "Article generation completed!" });
    } catch (error) {
      console.error('Finalization failed:', error);
      toast({ title: "Error", description: "Failed to finalize article", variant: "destructive" });
    } finally {
      setLoading('finalize', false);
    }
  };

  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: "Scrape Competitors",
      description: "Analyze competitor content for insights",
      completed: !!data.scrapeData,
      current: step === 0,
    },
    {
      id: 2,
      title: "Define Persona & Intent",
      description: "Understand target audience and search intent",
      completed: !!data.personaData,
      current: step === 1,
    },
    {
      id: 3,
      title: "Generate Outline",
      description: "Create detailed content structure",
      completed: !!data.outlineData,
      current: step === 2,
    },
    {
      id: 4,
      title: "Write H2 Sections",
      description: "Generate content for each section",
      completed: !!data.contentData,
      current: step === 3,
    },
    {
      id: 5,
      title: "Finalize & Optimize",
      description: "Add meta tags and publish content",
      completed: !!data.finalizeData,
      current: step === 4,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Content Generator</h1>
        
        <ProgressSteps steps={steps} currentStep={step} />
        
        <div className="mt-8">
          {step === 0 && (
            <StepScrape
              onComplete={handleScrape}
              onNext={nextStep}
              isLoading={loadingStates.scrape}
              results={data.scrapeData?.results || []}
            />
          )}
          
          {step === 1 && (
            <StepPersona
              onComplete={handlePersonaComplete}
              onPrevious={prevStep}
              isLoading={loadingStates.persona}
              personaAnalysis={data.personaData?.analysis}
            />
          )}
          
          {step === 2 && (
            <StepOutline
              onGenerate={handleOutlineGenerate}
              onPrevious={prevStep}
              onNext={nextStep}
              isLoading={loadingStates.outline}
              outline={data.outlineData?.outline}
            />
          )}
          
          {step === 3 && (
            <StepGenerate
              onGenerate={handleContentGenerate}
              onPrevious={prevStep}
              onNext={nextStep}
              isLoading={loadingStates.content}
              outline={data.outlineData?.outline}
              content={data.contentData?.sections || {}}
              generationProgress={data.contentData?.progress || 0}
            />
          )}
          
          {step === 4 && (
            <StepFinalize
              onFinalize={handleFinalize}
              onPrevious={prevStep}
              isLoading={loadingStates.finalize}
              outline={data.outlineData?.outline}
              metaTags={data.finalizeData?.metaTags}
              finalContent={data.finalizeData?.finalContent}
              wordCount={data.finalizeData?.wordCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}

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

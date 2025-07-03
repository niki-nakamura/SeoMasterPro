import { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { ProgressSteps } from "@/components/workflow/progress-steps";
import { GenerationPreview } from "@/components/workflow/generation-preview";
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

  const currentLoading = Object.values(loadingStates).some(loading => loading);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Content Generator</h1>
        
        <ProgressSteps steps={steps} currentStep={step + 1} isLoading={currentLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
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
          
          {/* Generation Preview Panel */}
          <div className="lg:col-span-1">
            <GenerationPreview 
              step={step + 1} 
              data={data} 
              isLoading={currentLoading} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Article } from "@shared/schema";
import type { WorkflowStep, ScrapedResult, PersonaAnalysis, ContentOutline, MetaTags } from "@/types/article";

export function useArticleWorkflow(articleId?: number) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const steps: WorkflowStep[] = [
    { id: 1, title: "Scrape", description: "Competitor analysis", completed: false, current: false },
    { id: 2, title: "Persona & Intent", description: "Target audience", completed: false, current: false },
    { id: 3, title: "Outline", description: "Content structure", completed: false, current: false },
    { id: 4, title: "Generate", description: "Write content", completed: false, current: false },
    { id: 5, title: "Finalize", description: "Meta & publish", completed: false, current: false },
  ];

  // Get article data
  const { data: article, isLoading: articleLoading } = useQuery<Article>({
    queryKey: ["/api/articles", articleId],
    enabled: !!articleId,
  });

  // Update steps based on article progress
  useEffect(() => {
    if (article) {
      setCurrentStep(article.currentStep);
    }
  }, [article]);

  const processedSteps = steps.map(step => ({
    ...step,
    completed: article ? step.id < article.currentStep : false,
    current: article ? step.id === article.currentStep : step.id === currentStep,
  }));

  // Scraping mutation
  const scrapeMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await apiRequest("POST", "/api/scrape", { keyword, maxResults: 8 });
      return response.json();
    },
    onSuccess: (data) => {
      if (articleId) {
        // Save scraped results to article
        apiRequest("POST", `/api/articles/${articleId}/scraped-urls`, data);
      }
    },
  });

  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: async (articleData: any) => {
      const response = await apiRequest("POST", "/api/articles", articleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    },
  });

  // Persona generation mutation
  const generatePersonaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/generate-persona", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId] });
      setCurrentStep(3);
    },
  });

  // Outline generation mutation
  const generateOutlineMutation = useMutation({
    mutationFn: async (data: { articleId: number }) => {
      const response = await apiRequest("POST", "/api/generate-outline", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId] });
      setCurrentStep(4);
    },
  });

  // Content generation mutation
  const generateContentMutation = useMutation({
    mutationFn: async (data: { articleId: number; section?: string }) => {
      const response = await apiRequest("POST", "/api/generate-content", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId] });
      setCurrentStep(5);
    },
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: async (data: { articleId: number }) => {
      const response = await apiRequest("POST", "/api/finalize", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    },
  });

  return {
    article,
    articleLoading,
    steps: processedSteps,
    currentStep,
    setCurrentStep,
    mutations: {
      scrape: scrapeMutation,
      createArticle: createArticleMutation,
      generatePersona: generatePersonaMutation,
      generateOutline: generateOutlineMutation,
      generateContent: generateContentMutation,
      finalize: finalizeMutation,
    },
  };
}

import { create } from 'zustand';
import type { ArticleFormData, ScrapedResult, PersonaAnalysis, ContentOutline, MetaTags } from '../types/article';

export interface WorkflowState {
  // Current step (0-4)
  step: number;
  
  // Data for each step
  data: {
    scrapeData?: {
      keyword: string;
      results: ScrapedResult[];
    };
    personaData?: {
      formData: ArticleFormData;
      analysis: PersonaAnalysis;
    };
    outlineData?: {
      outline: ContentOutline;
    };
    contentData?: {
      sections: { [key: string]: string };
      progress: number;
    };
    finalizeData?: {
      metaTags: MetaTags;
      finalContent: string;
      wordCount: number;
    };
  };
  
  // Actions
  setStep: (step: number) => void;
  setScrapeData: (data: { keyword: string; results: ScrapedResult[] }) => void;
  setPersonaData: (data: { formData: ArticleFormData; analysis: PersonaAnalysis }) => void;
  setOutlineData: (data: { outline: ContentOutline }) => void;
  setContentData: (data: { sections: { [key: string]: string }; progress: number }) => void;
  setFinalizeData: (data: { metaTags: MetaTags; finalContent: string; wordCount: number }) => void;
  
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  resetWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  step: 0,
  data: {},
  
  setStep: (step) => set({ step }),
  
  setScrapeData: (scrapeData) => set((state) => ({
    data: { ...state.data, scrapeData }
  })),
  
  setPersonaData: (personaData) => set((state) => ({
    data: { ...state.data, personaData }
  })),
  
  setOutlineData: (outlineData) => set((state) => ({
    data: { ...state.data, outlineData }
  })),
  
  setContentData: (contentData) => set((state) => ({
    data: { ...state.data, contentData }
  })),
  
  setFinalizeData: (finalizeData) => set((state) => ({
    data: { ...state.data, finalizeData }
  })),
  
  nextStep: () => set((state) => ({ 
    step: Math.min(state.step + 1, 4) 
  })),
  
  prevStep: () => set((state) => ({ 
    step: Math.max(state.step - 1, 0) 
  })),
  
  resetWorkflow: () => set({ 
    step: 0, 
    data: {} 
  }),
}));
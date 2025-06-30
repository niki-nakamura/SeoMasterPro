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
  
  // Local LLM Actions
  generateWithLocalLLM: (prompt: string, useScrapedData?: boolean) => Promise<string>;
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

  // Local LLM generation with scraped content context
  generateWithLocalLLM: async (prompt: string, useScrapedData = true) => {
    const { data } = get();
    let scrapedContent: string[] = [];
    
    if (useScrapedData && data.scrapeData?.results) {
      scrapedContent = data.scrapeData.results
        .filter(result => result.content)
        .map(result => `タイトル: ${result.title}\n内容: ${result.content}`)
        .slice(0, 7); // 最大7記事のコンテンツを使用
    }
    
    try {
      const { generateWithLocalLLM } = await import('@/lib/llm');
      return await generateWithLocalLLM({
        prompt,
        scrapedContent,
        model: 'tinymistral',
        keyword: data.scrapeData?.keyword
      });
    } catch (error) {
      console.error('Local LLM generation failed:', error);
      // フォールバック：サーバー経由でベクトル検索コンテキスト付き生成
      try {
        const keyword = data.scrapeData?.keyword || '';
        const response = await fetch('/proxy/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: 'tinymistral',
            useContext: true,
            keyword
          })
        });
        
        if (!response.ok) throw new Error('Server LLM fallback failed');
        
        const result = await response.json();
        return result.text;
      } catch (fallbackError) {
        console.error('Server LLM fallback also failed:', fallbackError);
        throw error; // 元のエラーを返す
      }
    }
  },
}));
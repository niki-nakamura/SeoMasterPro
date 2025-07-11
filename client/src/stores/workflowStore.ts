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

  // WebLLM generation with vector search context
  generateWithLocalLLM: async (prompt: string, useScrapedData = true) => {
    const { data } = get();
    
    // pgvector TOP-k検索でコンテキストを取得
    let contextText = '';
    if (data.scrapeData?.keyword) {
      try {
        const response = await fetch('/api/llm-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: data.scrapeData.keyword })
        });
        
        if (response.ok) {
          const contextData = await response.json();
          contextText = contextData.contextText;
          console.log(`pgvector TOP-k検索: ${contextData.count}件のコンテキストを取得`);
        }
      } catch (error) {
        console.log('LLMコンテキスト取得をスキップ:', error);
      }
    }

    // プロンプトにコンテキストを追加
    let enhancedPrompt = prompt;
    if (contextText) {
      enhancedPrompt = `【関連コンテンツ】
${contextText}

【質問】
${prompt}

上記の関連コンテンツを参考にして、詳細で実用的な回答を生成してください。`;
    }
    
    try {
      // WebLLM を使用してブラウザ内で生成
      const { generateWithWebLLM, isWebLLMReady } = await import('@/lib/webllm');
      
      if (!isWebLLMReady()) {
        throw new Error('WebLLM is not initialized. Please initialize Llama 3 8B in settings.');
      }
      
      return await generateWithWebLLM(enhancedPrompt);
    } catch (error) {
      console.error('WebLLM generation failed:', error);
      throw new Error(`WebLLMでの生成に失敗しました: ${(error as Error).message}`);
    }
  },
}));
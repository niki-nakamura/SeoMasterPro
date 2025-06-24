export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface ScrapedResult {
  url: string;
  title: string;
  content?: string;
  domain: string;
}

export interface PersonaAnalysis {
  targetAudience: string;
  searchIntent: string;
  contentGoals: string[];
  toneSuggestions: string;
  keyTopics: string[];
}

export interface ContentOutline {
  title: string;
  introduction: string;
  sections: Array<{
    heading: string;
    subheadings: string[];
    keyPoints: string[];
  }>;
  conclusion: string;
  estimatedWordCount: number;
}

export interface MetaTags {
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string[];
  socialTitle: string;
  socialDescription: string;
}

export interface ArticleFormData {
  targetKeyword: string;
  industry: string;
  contentType: string;
  additionalContext?: string;
}

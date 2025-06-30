// Local Ollama LLM client for browser-direct communication
export interface OllamaResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
}

export async function callOllama(prompt: string, model = 'tinymistral'): Promise<string> {
  const baseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model, 
        prompt, 
        stream: false 
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const json: OllamaResponse = await response.json();
    return json.response || '';
  } catch (error) {
    console.error('Ollama connection failed:', error);
    throw new Error(`ローカルLLMへの接続に失敗しました: ${(error as Error).message}`);
  }
}

export async function testOllamaConnection(): Promise<boolean> {
  try {
    await callOllama('Hello', 'tinymistral');
    return true;
  } catch {
    return false;
  }
}

export async function generateWithLocalLLM(data: {
  prompt: string;
  scrapedContent?: string[];
  model?: string;
  keyword?: string;
}): Promise<string> {
  const { prompt, scrapedContent = [], model = 'tinymistral', keyword } = data;
  
  // TOP-k ベクトル検索でコンテキストを取得
  let vectorContext: string[] = [];
  if (keyword) {
    try {
      const response = await fetch('/api/vector-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, k: 7 })
      });
      
      if (response.ok) {
        const { results } = await response.json();
        vectorContext = results.map((r: any) => 
          `タイトル: ${r.title}\nURL: ${r.url}\n内容: ${r.content.slice(0, 1000)}...`
        );
      }
    } catch (error) {
      console.log('ベクトル検索をスキップ:', error);
    }
  }
  
  // 全コンテキスト（スクレイピング + ベクトル）を統合
  const allContent = [...scrapedContent, ...vectorContext];
  
  // コンテキストをトークン制限内でチャンク結合（8K token制限対応）
  let fullPrompt = prompt;
  if (allContent.length > 0) {
    const maxTokens = 6000; // 余裕を持って6K tokens
    let contextData = '';
    let currentTokens = 0;
    
    for (const content of allContent.slice(0, 7)) {
      const contentTokens = Math.ceil(content.length / 4); // 概算：4文字≈1token
      if (currentTokens + contentTokens > maxTokens) break;
      
      contextData += content + '\n\n---\n\n';
      currentTokens += contentTokens;
    }
    
    if (contextData) {
      fullPrompt = `以下の参考記事を踏まえて回答してください：

${contextData}

---

質問: ${prompt}`;
    }
  }

  return await callOllama(fullPrompt, model);
}
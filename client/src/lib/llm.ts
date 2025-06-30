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
}): Promise<string> {
  const { prompt, scrapedContent = [], model = 'tinymistral' } = data;
  
  // スクレイピング済みコンテンツをコンテキストに追加（8K token制限対応）
  let fullPrompt = prompt;
  if (scrapedContent.length > 0) {
    // TOP-k（最大7記事）のコンテンツをトークン制限内でチャンク結合
    const maxTokens = 6000; // 余裕を持って6K tokens
    let contextData = '';
    let currentTokens = 0;
    
    for (const content of scrapedContent.slice(0, 7)) {
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
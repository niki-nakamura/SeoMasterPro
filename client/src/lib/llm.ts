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
  
  // スクレイピング済みコンテンツをコンテキストに追加
  let fullPrompt = prompt;
  if (scrapedContent.length > 0) {
    const contextData = scrapedContent.slice(0, 7).join('\n\n---\n\n');
    fullPrompt = `以下の参考記事を踏まえて回答してください：

${contextData}

---

質問: ${prompt}`;
  }

  return await callOllama(fullPrompt, model);
}
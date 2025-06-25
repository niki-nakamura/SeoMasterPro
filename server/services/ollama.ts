// Ollama LLM proxy service
export interface OllamaRequest {
  prompt: string;
  model?: string;
}

export interface OllamaResponse {
  text: string;
}

export async function generateWithOllama(request: OllamaRequest): Promise<OllamaResponse> {
  const { prompt, model = "tinymistral" } = request;
  
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      text: data.response || ""
    };
  } catch (error) {
    console.error("Ollama generation failed:", error);
    throw new Error(`Ollama generation failed: ${(error as Error).message}`);
  }
}
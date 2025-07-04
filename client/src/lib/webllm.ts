import * as webllm from "@mlc-ai/web-llm";

export interface WebLLMProgress {
  progress: number;
  text?: string;
  timeElapsed?: number;
}

export interface WebLLMInstance {
  engine: webllm.MLCEngine;
  model: string;
  isReady: boolean;
}

// Global WebLLM instance
declare global {
  interface Window {
    __webllm?: WebLLMInstance;
  }
}

/**
 * Check if WebGPU is supported in the current browser
 */
export function isWebGPUSupported(): boolean {
  try {
    // Check for WebGPU support
    return "gpu" in navigator && navigator.gpu !== undefined;
  } catch (error) {
    console.warn("WebGPU detection failed:", error);
    return false;
  }
}

/**
 * Initialize WebLLM with Llama 3 8B model for production use
 */
export async function initLlama3(
  onProgress: (progress: number) => void
): Promise<webllm.MLCEngine> {
  if (!isWebGPUSupported()) {
    throw new Error("WebGPU is not supported in this browser");
  }

  const model = "Llama-3-8B-Instruct-q4f16_1-MLC";
  
  // Create engine with progress callback
  const engine = new webllm.MLCEngine();
  
  engine.setInitProgressCallback((progress: webllm.InitProgressReport) => {
    const percent = progress.progress || 0;
    onProgress(percent);
  });

  await engine.reload(model);
  
  // Store in global for chat interface
  const instance: WebLLMInstance = {
    engine,
    model,
    isReady: true
  };
  
  if (typeof window !== "undefined") {
    window.__webllm = instance;
  }
  
  return engine;
}

/**
 * Initialize WebLLM with progress tracking (legacy TinyLlama)
 */
export async function initWebLLM(
  onProgress: (progress: WebLLMProgress) => void,
  model: string = "TinyLlama-1.1B-Chat-v0.4-q4f16_1-1k"
): Promise<WebLLMInstance> {
  try {
    if (!isWebGPUSupported()) {
      throw new Error("WebGPU is not supported in this browser");
    }

    const engine = new webllm.MLCEngine();
    
    // Set up progress callback
    engine.setInitProgressCallback((report: any) => {
      onProgress({
        progress: report.progress || 0,
        text: report.text || "",
        timeElapsed: report.timeElapsed || 0
      });
    });

    // Initialize with a built-in lightweight model
    await engine.reload(model);

    const instance: WebLLMInstance = {
      engine,
      model,
      isReady: true
    };

    // Store globally for chat access
    window.__webllm = instance;

    return instance;
  } catch (error) {
    console.error("WebLLM initialization failed:", error);
    throw error;
  }
}

/**
 * Generate chat completion using WebLLM
 */
export async function generateWithWebLLM(
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}
): Promise<string> {
  if (!window.__webllm?.isReady) {
    throw new Error("WebLLM is not initialized");
  }

  try {
    const engine = window.__webllm.engine;
    
    // Use the proper WebLLM chat completion API
    const response = await engine.chat.completions.create({
      messages: messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content
      })),
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      stream: false
    });
    
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("WebLLM generation failed:", error);
    throw error;
  }
}

/**
 * Simple WebLLM streaming (placeholder for now)
 */
export async function* generateStreamWithWebLLM(
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
): AsyncGenerator<string, void, unknown> {
  if (!window.__webllm?.isReady) {
    throw new Error("WebLLM is not initialized");
  }

  try {
    // For now, just yield the non-streaming response in chunks
    const response = await generateWithWebLLM(messages, options);
    const words = response.split(' ');
    
    for (const word of words) {
      yield word + ' ';
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming
    }
  } catch (error) {
    console.error("WebLLM streaming failed:", error);
    throw error;
  }
}

/**
 * Clean up WebLLM instance
 */
export function cleanupWebLLM(): void {
  if (window.__webllm?.engine) {
    try {
      // WebLLM cleanup if available
      window.__webllm = undefined;
    } catch (error) {
      console.warn("WebLLM cleanup warning:", error);
    }
  }
}

/**
 * Check if WebLLM is ready for use
 */
export function isWebLLMReady(): boolean {
  return window.__webllm?.isReady === true;
}

/**
 * Get current WebLLM model info
 */
export function getWebLLMInfo(): { model: string; isReady: boolean } | null {
  if (!window.__webllm) return null;
  
  return {
    model: window.__webllm.model,
    isReady: window.__webllm.isReady
  };
}
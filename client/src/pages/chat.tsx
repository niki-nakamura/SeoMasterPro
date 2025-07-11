import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Settings, Zap, Download, Monitor, Cpu } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Link, useLocation } from "wouter";
import { isWebGPUSupported, isWebLLMReady, generateWithWebLLM } from "@/lib/webllm";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OllamaStatus {
  running: boolean;
  models?: Array<{ name: string }>;
}

const checkOllamaStatus = async (): Promise<OllamaStatus> => {
  try {
    const response = await fetch('/api/ollama/status');
    if (!response.ok) {
      return { running: false, models: [] };
    }
    const data = await response.json();
    return {
      running: data.running || false,
      models: data.models || []
    };
  } catch (error) {
    console.error('Failed to check Ollama status:', error);
    return { running: false, models: [] };
  }
};

export default function Chat() {
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState("tinymistral");
  const [isChecking, setIsChecking] = useState(true);
  const [webGPUSupported, setWebGPUSupported] = useState<boolean>(false);
  const [currentLLMMode, setCurrentLLMMode] = useState<'webgpu' | 'ollama' | 'none'>('none');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortController = useRef<AbortController | null>(null);
  const [, setLocation] = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check LLM status (both WebLLM and Ollama) on component mount
  useEffect(() => {
    const checkInitialStatus = async () => {
      setIsChecking(true);
      
      // Check WebGPU support
      const webGPUAvailable = isWebGPUSupported();
      setWebGPUSupported(webGPUAvailable);
      
      // Check WebLLM readiness
      const webLLMReady = isWebLLMReady();
      
      // Check Ollama status
      const ollamaStatus = await checkOllamaStatus();
      
      // Determine current LLM mode
      if (webLLMReady) {
        setCurrentLLMMode('webgpu');
        setIsStarted(true);
      } else if (ollamaStatus.running && ollamaStatus.models?.some((m: any) => m.name === 'tinymistral')) {
        setCurrentLLMMode('ollama');
        setIsStarted(true);
      } else {
        setCurrentLLMMode('none');
        setIsStarted(false);
      }
      
      if (!webLLMReady && !ollamaStatus.running) {
        toast({
          title: "ローカルLLMが動作していません",
          description: "設定ページでOllamaサーバーを起動してください",
          variant: "destructive"
        });
        setTimeout(() => setLocation('/settings'), 2000);
        return;
      }
      
      const hasModel = ollamaStatus.models?.some((m: any) => m.name === selectedModel);
      if (!webLLMReady && !hasModel) {
        toast({
          title: "必要なモデルがインストールされていません",
          description: `設定ページで ${selectedModel} をダウンロードしてください`,
          variant: "destructive"
        });
        setTimeout(() => setLocation('/settings'), 2000);
        return;
      }
      
      setIsChecking(false);
    };
    
    checkInitialStatus();
  }, [selectedModel, setLocation, toast]);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch("/api/ollama/status");
      const data = await response.json();
      setOllamaStatus(data);
      return data;
    } catch (error) {
      console.error("Failed to check Ollama status:", error);
      return { running: false, models: [] };
    }
  };

  const handleStartChat = async () => {
    const status = await checkOllamaStatus();
    
    if (!status.running) {
      toast({
        title: "Ollamaサーバーが起動していません",
        description: "設定ページでサーバーを起動してください",
        variant: "destructive",
      });
      return;
    }

    const hasModel = status.models?.some((m: any) => m.name === selectedModel);
    if (!hasModel) {
      toast({
        title: "モデルがインストールされていません",
        description: `設定ページで ${selectedModel} をダウンロードしてください`,
        variant: "destructive",
      });
      return;
    }

    setIsStarted(true);
    setMessages([
      {
        role: "assistant",
        content: "こんにちは！何でもお気軽にお聞きください。"
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage }
    ];
    setMessages(newMessages);

    try {
      if (currentLLMMode === 'webgpu') {
        // Use WebLLM for browser-based inference
        await handleWebLLMGeneration(newMessages);
      } else if (currentLLMMode === 'ollama') {
        // Use Ollama for server-based inference
        await handleOllamaGeneration(newMessages);
      } else {
        throw new Error("No LLM mode available");
      }
    } catch (error) {
      console.error("Message generation failed:", error);
      toast({
        title: "エラー",
        description: "メッセージの生成に失敗しました",
        variant: "destructive",
      });
      // Remove the user message if generation failed
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  // WebLLM generation function
  const handleWebLLMGeneration = async (newMessages: Message[]) => {
    // Add empty assistant message for streaming
    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const response = await generateWithWebLLM(newMessages);
      
      // Update the assistant message with the complete response
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("WebLLM generation failed:", error);
      throw error;
    }
  };

  // Ollama generation function
  const handleOllamaGeneration = async (newMessages: Message[]) => {
    // Add empty assistant message for streaming
    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    // Abort any existing request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      // Check if WebLLM is available and use it for inference
      if ((window as any).__webllm) {
        const engine = (window as any).__webllm.engine;
        const response = await engine.chat.completions.create({
          messages: newMessages.map((msg: Message) => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const assistantResponse = response.choices[0]?.message?.content || "";
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            content: assistantResponse
          };
          return updated;
        });
        setIsLoading(false);
      } else {
        // Fallback to Ollama SSE streaming
        await fetchEventSource("/api/ollama/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: newMessages,
          }),
          signal: abortController.current.signal,
          onmessage(evt) {
            try {
              const data = JSON.parse(evt.data);
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.message?.content) {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[assistantMessageIndex] = {
                    ...updated[assistantMessageIndex],
                    content: updated[assistantMessageIndex].content + data.message.content
                  };
                  return updated;
                });
              }

              if (data.done) {
                setIsLoading(false);
              }
            } catch (error) {
              console.error("Error parsing message:", error);
            }
          },
          onerror(err) {
            console.error("EventSource failed:", err);
            toast({
              title: "チャットエラー",
              description: "メッセージの送信に失敗しました",
              variant: "destructive",
            });
            setIsLoading(false);
          },
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Chat error:", error);
        
        if (error.message?.includes("not running")) {
          toast({
            title: "サーバーエラー",
            description: "Ollamaサーバーが停止しています。設定ページで起動してください。",
            variant: "destructive",
          });
        } else if (error.message?.includes("not installed")) {
          toast({
            title: "モデルエラー", 
            description: `${selectedModel} がインストールされていません。設定ページでダウンロードしてください。`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "チャットエラー",
            description: "メッセージの送信に失敗しました",
            variant: "destructive",
          });
        }
        
        // Remove the empty assistant message on error
        setMessages(prev => prev.slice(0, -1));
      }
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64 pt-16">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {!isStarted ? (
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-blue-600 mb-4">
                    ローカルLLM ChatUI
                  </h1>
                  
                  {isChecking ? (
                    <div className="max-w-md mx-auto">
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-b-transparent" />
                            <div>
                              <h4 className="font-medium text-blue-800">システムチェック中</h4>
                              <p className="text-sm text-blue-700">Ollamaサーバーとモデルの確認中...</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                      <p>
                        このチャットUIでは、ローカルで動作するLLMと会話することができます。
                        外部APIは使用せず、完全にオフラインで動作します。
                      </p>
                      <p>
                        PCでの利用を想定しており、最初のモデルのダウンロードが完了すれば完全オフラインで会話することが可能です。
                      </p>
                    </div>
                  )}

                  {/* LLM Mode Status Display */}
                  <div className="max-w-md mx-auto space-y-3">
                    {/* WebGPU Status */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span className="font-medium">WebGPU ブラウザ推論</span>
                          </div>
                          <Badge variant={webGPUSupported ? "default" : "outline"}>
                            {webGPUSupported ? "対応" : "未対応"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {isWebLLMReady() ? (
                            <span className="text-green-600">✅ 利用可能（TinyLlama 1.1B）</span>
                          ) : webGPUSupported ? (
                            <span className="text-orange-600">⚠️ 初期化が必要</span>
                          ) : (
                            <span className="text-gray-500">ブラウザが非対応</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ollama Status */}
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4" />
                            <span className="font-medium">Ollama サーバー推論</span>
                          </div>
                          <Badge variant={ollamaStatus?.running ? "default" : "destructive"}>
                            {ollamaStatus?.running ? "起動中" : "停止中"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {ollamaStatus?.running ? (
                            <span className="text-green-600">✅ 利用可能モデル: {ollamaStatus.models?.length || 0}個</span>
                          ) : (
                            <span>設定ページでサーバーを起動してください</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={handleStartChat}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    チャットを始める
                  </Button>

                  <div className="flex justify-center gap-4 text-sm">
                    <Link href="/settings">
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        設定ページ
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">チャット</h1>
                  <div className="flex items-center gap-2">
                    {/* Current LLM Mode Indicator */}
                    {currentLLMMode === 'webgpu' ? (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        <Monitor className="h-3 w-3 mr-1" />
                        WebGPU推論
                      </Badge>
                    ) : currentLLMMode === 'ollama' ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Cpu className="h-3 w-3 mr-1" />
                        Ollama ({selectedModel})
                      </Badge>
                    ) : (
                      <Badge variant="outline">推論モード未設定</Badge>
                    )}
                    
                    <Link href="/settings">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <Card className="h-[60vh] flex flex-col">
                  <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </CardContent>
                  
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="メッセージを入力..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
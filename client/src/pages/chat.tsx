import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Settings, Zap, Download } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Link } from "wouter";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OllamaStatus {
  running: boolean;
  models?: Array<{ name: string }>;
}

export default function Chat() {
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState("tinymistral");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortController = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Add empty assistant message for streaming
    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    // Abort any existing request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
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
                  
                  <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                    <p>
                      このチャットUIでは、ローカルで動作するLLMと会話することができます。
                      外部APIは使用せず、完全にオフラインで動作します。
                    </p>
                    <p>
                      PCでの利用を想定しており、最初のモデルのダウンロードが完了すれば完全オフラインで会話することが可能です。
                    </p>
                  </div>

                  {ollamaStatus && (
                    <div className="max-w-md mx-auto">
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Ollamaサーバー</span>
                            <Badge variant={ollamaStatus.running ? "default" : "destructive"}>
                              {ollamaStatus.running ? "起動中" : "停止中"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {ollamaStatus.running ? (
                              <span>利用可能モデル: {ollamaStatus.models?.length || 0}個</span>
                            ) : (
                              <span>設定ページでサーバーを起動してください</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
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
                    <Badge variant="outline">{selectedModel}</Badge>
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
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Settings, Zap, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { isWebGPUSupported, isWebLLMReady, generateWithWebLLM } from "@/lib/webllm";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webGPUSupported, setWebGPUSupported] = useState<boolean>(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check WebGPU support and WebLLM readiness on mount
  useEffect(() => {
    const checkStatus = async () => {
      const webGPUAvailable = isWebGPUSupported();
      setWebGPUSupported(webGPUAvailable);
      
      const webLLMReady = isWebLLMReady();
      
      if (!webGPUAvailable) {
        toast({
          title: "WebGPU未対応",
          description: "WebGPU対応ブラウザ（Chrome/Edge 119+）でアクセスしてください。",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/settings');
        }, 3000);
      } else if (!webLLMReady) {
        toast({
          title: "WebLLMが初期化されていません",
          description: "設定ページでLlama 3 8Bを初期化してください。",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/settings');
        }, 3000);
      }
    };
    
    checkStatus();
  }, [toast, setLocation]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    if (!webGPUSupported) {
      toast({
        title: "WebGPU未対応",
        description: "WebGPU対応ブラウザが必要です。設定ページで確認してください。",
        variant: "destructive",
      });
      return;
    }

    if (!isWebLLMReady()) {
      toast({
        title: "WebLLMが初期化されていません",
        description: "設定ページでLlama 3 8Bを初期化してください。",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Use WebLLM for generation
      const response = await generateWithWebLLM(inputValue);
      
      const assistantMessage: Message = { 
        role: "assistant", 
        content: response
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('WebLLM generation error:', error);
      toast({
        title: "生成エラー",
        description: "メッセージの生成に失敗しました。再試行してください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          
          {/* Header with Status */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">WebLLM チャット</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ブラウザ内Llama 3 8Bとの対話
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={webGPUSupported && isWebLLMReady() ? "default" : "destructive"}>
                  {webGPUSupported ? (isWebLLMReady() ? "✅ 準備完了" : "⚠️ 未初期化") : "❌ WebGPU非対応"}
                </Badge>
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    設定
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(!webGPUSupported || !isWebLLMReady()) && (
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <h3 className="font-medium text-orange-900 dark:text-orange-100">
                        {!webGPUSupported ? "WebGPU非対応ブラウザ" : "WebLLM未初期化"}
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        {!webGPUSupported 
                          ? "Chrome/Edge 119+のWebGPU対応ブラウザでアクセスしてください。"
                          : "設定ページでLlama 3 8Bモデルを初期化してください。"
                        }
                      </p>
                      <Link href="/settings">
                        <Button variant="outline" size="sm" className="mt-2">
                          設定ページに移動
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {messages.length === 0 && webGPUSupported && isWebLLMReady() && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Zap className="h-8 w-8 mx-auto mb-2" />
                    <p>Llama 3 8Bとの対話を開始しましょう</p>
                    <p className="text-sm mt-1">何でもお聞きください！</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Llama 3が考えています...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !webGPUSupported 
                    ? "WebGPU対応ブラウザが必要です" 
                    : !isWebLLMReady()
                    ? "WebLLMを初期化してください"
                    : "メッセージを入力..."
                }
                disabled={!webGPUSupported || !isWebLLMReady() || isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!webGPUSupported || !isWebLLMReady() || isLoading || !inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
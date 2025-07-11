import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Settings as SettingsIcon, Zap, Download, Monitor, Cpu } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isWebGPUSupported, initLlama3, isWebLLMReady } from "@/lib/webllm";

export default function Settings() {
  const [webGPUSupported, setWebGPUSupported] = useState<boolean>(false);
  const [webLLMProgress, setWebLLMProgress] = useState<number>(0);
  const [isInitializingWebLLM, setIsInitializingWebLLM] = useState(false);
  const [startupProgress, setStartupProgress] = useState<string>('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // WebLLM initialization with Llama 3 8B (WebGPU専用)
  const handleStartWebLLM = async () => {
    if (!webGPUSupported) {
      toast({
        title: "WebGPU未対応",
        description: "WebGPU対応ブラウザ（Chrome/Edge 119+）でアクセスしてください。",
        variant: "destructive",
      });
      return;
    }

    setIsInitializingWebLLM(true);
    setWebLLMProgress(0);

    try {
      // Use initLlama3 for production Llama 3 8B model
      await initLlama3((progress: number) => {
        const percent = Math.round(progress * 100);
        setWebLLMProgress(percent);
        const downloadedMB = Math.round(progress * 1900);
        setStartupProgress(`Fetching params ${downloadedMB} / 1900 MB`);
      });

      toast({
        title: "Llama 3 8B 準備完了",
        description: "ブラウザ内Llama 3 8Bが準備完了しました。チャット画面に移動します。",
      });

      // Auto-redirect to chat
      setTimeout(() => {
        setLocation('/chat');
      }, 2000);

    } catch (error) {
      console.error('WebLLM initialization failed:', error);
      toast({
        title: "WebLLM初期化失敗",
        description: "モデルのダウンロードまたは初期化に失敗しました。再試行してください。",
        variant: "destructive",
      });
    } finally {
      setIsInitializingWebLLM(false);
      setWebLLMProgress(0);
      setStartupProgress('');
    }
  };

  // WebGPU検出のuseEffect
  useEffect(() => {
    const checkWebGPU = async () => {
      const supported = isWebGPUSupported();
      setWebGPUSupported(supported);
    };
    
    checkWebGPU();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WebLLM 設定</h1>
                <p className="text-gray-600 dark:text-gray-300">ブラウザ内AI（Llama 3 8B）の設定とセットアップ</p>
              </div>
            </div>

            {/* WebGPU Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    <CardTitle>ブラウザ対応状況</CardTitle>
                  </div>
                  <Badge variant={webGPUSupported ? "default" : "destructive"}>
                    WebGPU サポート: {webGPUSupported ? "✅ 対応" : "❌ 非対応"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webGPUSupported ? (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-green-900 dark:text-green-100">WebGPU対応ブラウザ</h3>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            お使いのブラウザはWebGPUに対応しています。高性能なLlama 3 8Bモデル（1.9GB）を
                            ブラウザ内で直接実行できます。推論速度：9-11 tokens/秒
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-red-900 dark:text-red-100">WebGPU非対応ブラウザ</h3>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            WebGPU対応ブラウザ（Chrome/Edge 119+、4GB+ VRAM）でアクセスしてください。
                            Firefox、Safari、または古いバージョンのブラウザは対応していません。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* WebLLM Setup Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  <CardTitle>Llama 3 8B セットアップ</CardTitle>
                </div>
                <CardDescription>
                  ブラウザ内でLlama 3 8Bモデルを初期化します（初回のみ1.9GBダウンロード）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* Model Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-medium text-gray-900 dark:text-white">モデル</div>
                      <div className="text-gray-600 dark:text-gray-300">Llama 3 8B Instruct</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-medium text-gray-900 dark:text-white">サイズ</div>
                      <div className="text-gray-600 dark:text-gray-300">1.9 GB (64 shards)</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-medium text-gray-900 dark:text-white">推論速度</div>
                      <div className="text-gray-600 dark:text-gray-300">9-11 tokens/秒</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isInitializingWebLLM && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{startupProgress}</span>
                        <span className="text-gray-600 dark:text-gray-300">{webLLMProgress}%</span>
                      </div>
                      <Progress value={webLLMProgress} className="h-2" />
                    </div>
                  )}

                  {/* Setup Button */}
                  <Button
                    onClick={handleStartWebLLM}
                    disabled={!webGPUSupported || isInitializingWebLLM}
                    className="w-full"
                    size="lg"
                  >
                    {isInitializingWebLLM ? (
                      <>
                        <Download className="h-4 w-4 mr-2 animate-spin" />
                        モデルを初期化中...
                      </>
                    ) : isWebLLMReady() ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        セットアップ完了 - チャットへ
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Llama 3 8B を開始
                      </>
                    )}
                  </Button>

                  {!webGPUSupported && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      WebGPU対応ブラウザが必要です
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>システム情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">ブラウザ</div>
                    <div className="text-gray-600 dark:text-gray-300">{navigator.userAgent.split(' ')[0]}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">WebGPU</div>
                    <div className="text-gray-600 dark:text-gray-300">{webGPUSupported ? "対応" : "非対応"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">コア数</div>
                    <div className="text-gray-600 dark:text-gray-300">{navigator.hardwareConcurrency || "不明"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">メモリ</div>
                    <div className="text-gray-600 dark:text-gray-300">{(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : "不明"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
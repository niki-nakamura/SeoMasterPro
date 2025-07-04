import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Settings as SettingsIcon, Zap, Download, Trash2, Server, Monitor, Cpu } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { testOllamaConnection } from "@/lib/llm";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isWebGPUSupported, initWebLLM, initLlama3, isWebLLMReady, WebLLMProgress } from "@/lib/webllm";

interface OllamaModel {
  name: string;
  size?: number;
  modified_at?: string;
}

interface DownloadProgress {
  status?: string;
  digest?: string;
  total?: number;
  completed?: number;
  percent?: number;
}

export default function Settings() {
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: DownloadProgress }>({});
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [startupProgress, setStartupProgress] = useState<string>('');
  const [initPhase, setInitPhase] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('');
  const [webGPUSupported, setWebGPUSupported] = useState<boolean>(false);
  const [webLLMProgress, setWebLLMProgress] = useState<number>(0);
  const [isInitializingWebLLM, setIsInitializingWebLLM] = useState(false);
  const [llmMode, setLLMMode] = useState<'webgpu' | 'ollama' | 'auto'>('auto');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const isLiteMode = import.meta.env.VITE_LITE_MODE === 'true' || false;
  const recommendedModels = isLiteMode ? [
    { name: 'tinymistral', description: 'Replit軽量モード - 高速テキスト生成（推奨）', size: '340MB' }
  ] : [
    { name: 'tinymistral', description: '軽量で高速なテキスト生成モデル', size: '637MB' },
    { name: 'mxbai-embed-large', description: 'ベクトル埋め込み生成モデル', size: '334MB' },
    { name: 'llama3.2:3b', description: '高品質な多言語対応モデル', size: '2.0GB' }
  ];

  const fetchOllamaStatus = async () => {
    try {
      const response = await fetch('/api/ollama/status');
      const data = await response.json();
      
      if (data.running) {
        setConnectionStatus('success');
        setModels(data.models || []);
      } else {
        setConnectionStatus('error');
        setModels([]);
      }
    } catch (error) {
      setConnectionStatus('error');
      setModels([]);
    }
  };

  // New unified LLM startup function with WebGPU detection
  const handleStartLLM = async () => {
    // Auto-detect mode if set to auto
    let selectedMode = llmMode;
    if (llmMode === 'auto') {
      selectedMode = webGPUSupported ? 'webgpu' : 'ollama';
    }

    if (selectedMode === 'webgpu') {
      await handleStartWebLLM();
    } else {
      await handleStartOllama();
    }
  };

  // WebLLM initialization with Llama 3 8B
  const handleStartWebLLM = async () => {
    if (!webGPUSupported) {
      toast({
        title: "WebGPU未対応",
        description: "お使いのブラウザはWebGPUに対応していません。Ollamaモードに切り替えます。",
        variant: "destructive",
      });
      await handleStartOllama();
      return;
    }

    setIsInitializingWebLLM(true);
    setWebLLMProgress(0);
    setInitPhase('download');

    try {
      // Use initLlama3 for production Llama 3 8B model
      await initLlama3((progress: number) => {
        const percent = Math.round(progress * 100);
        setWebLLMProgress(percent);
        setStartupProgress(`Fetching Llama 3 8B model... ${percent}%`);
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
        description: "Ollamaモードに切り替えます。",
        variant: "destructive",
      });
      // Fallback to Ollama
      await handleStartOllama();
    } finally {
      setIsInitializingWebLLM(false);
      setWebLLMProgress(0);
      setStartupProgress('');
      setInitPhase('');
    }
  };

  // Original Ollama startup function
  const handleStartOllama = async () => {
    try {
      setIsStartingOllama(true);
      setStartupProgress('初期化を開始中...');
      setInitPhase('start');
      setCurrentModel('');
      
      const eventSource = new EventSource('/api/ollama/init', {
        withCredentials: false
      });
      
      eventSource.addEventListener('phase', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'start':
              setInitPhase('start');
              setStartupProgress(data.message);
              break;
              
            case 'pull':
              setInitPhase('pull');
              setCurrentModel(data.model || '');
              setStartupProgress(data.message);
              break;
              
            case 'ready':
              setInitPhase('ready');
              setStartupProgress(data.message);
              
              toast({
                title: "セットアップ完了",
                description: "Ollamaサーバーとモデルの準備が完了しました。チャット画面に移動します。",
              });
              
              // Auto-redirect to chat page
              setTimeout(() => {
                setLocation('/chat');
              }, 2000);
              break;
          }
        } catch (e) {
          console.error('Failed to parse phase data:', e);
        }
      });
      
      eventSource.addEventListener('error', (event) => {
        try {
          const data = JSON.parse((event as any).data);
          throw new Error(data.message || 'セットアップエラー');
        } catch (e) {
          throw new Error('セットアップ中にエラーが発生しました');
        }
      });
      
      eventSource.onerror = (error) => {
        eventSource.close();
        toast({
          title: "セットアップエラー",
          description: "セットアップ中にエラーが発生しました",
          variant: "destructive",
        });
        setIsStartingOllama(false);
        setStartupProgress('');
        setInitPhase('');
        setCurrentModel('');
      };
      
      eventSource.onmessage = (event) => {
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            // Handle model download progress
            if (data.status && data.total && data.completed !== undefined) {
              const percent = Math.round((data.completed / data.total) * 100);
              setDownloadProgress(prev => ({
                ...prev,
                [currentModel]: { ...data, percent }
              }));
            }
          } catch (e) {
            // Handle non-JSON data
          }
        }
      };
      
      // Auto-close after ready phase
      eventSource.addEventListener('phase', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'ready') {
          setTimeout(() => {
            eventSource.close();
            setIsStartingOllama(false);
            setStartupProgress('');
            setInitPhase('');
            setCurrentModel('');
            fetchOllamaStatus();
          }, 3000);
        }
      });
      
    } catch (error) {
      toast({
        title: "セットアップエラー",
        description: `セットアップに失敗しました: ${(error as Error).message}`,
        variant: "destructive",
      });
      setIsStartingOllama(false);
      setStartupProgress('');
      setInitPhase('');
      setCurrentModel('');
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setIsLoadingModels(true);
    
    try {
      await fetchOllamaStatus();
      
      if (connectionStatus === 'success') {
        toast({
          title: "接続成功",
          description: "ローカルLLMとの接続が確認できました",
        });
      } else {
        toast({
          title: "接続失敗", 
          description: "ローカルLLMに接続できませんでした。Ollamaが起動していることを確認してください。",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "接続エラー",
        description: "ローカルLLMへの接続でエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleDownloadModel = async (modelName: string) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [modelName]: { status: 'downloading' } }));
      
      const response = await fetch('/api/ollama/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName }),
      });

      if (!response.ok) {
        throw new Error('Failed to start download');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                setDownloadProgress(prev => ({
                  ...prev,
                  [modelName]: {
                    status: data.status,
                    total: data.total,
                    completed: data.completed,
                  }
                }));
                
                if (data.status === 'success') {
                  toast({
                    title: "ダウンロード完了",
                    description: `${modelName} のダウンロードが完了しました`,
                  });
                  await fetchOllamaStatus();
                  setDownloadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[modelName];
                    return newProgress;
                  });
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      toast({
        title: "ダウンロードエラー",
        description: `${modelName} のダウンロードに失敗しました: ${(error as Error).message}`,
        variant: "destructive",
      });
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelName];
        return newProgress;
      });
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    try {
      const response = await fetch(`/api/ollama/models/${encodeURIComponent(modelName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete model');
      }

      toast({
        title: "削除完了",
        description: `${modelName} を削除しました`,
      });
      
      await fetchOllamaStatus();
    } catch (error) {
      toast({
        title: "削除エラー",
        description: `${modelName} の削除に失敗しました`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOllamaStatus();
    
    // Check WebGPU support on mount
    setWebGPUSupported(isWebGPUSupported());
    
    // Poll Ollama status every 10 seconds
    const pollInterval = setInterval(async () => {
      if (!isStartingOllama && !isInitializingWebLLM) {
        await fetchOllamaStatus();
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isStartingOllama, isInitializingWebLLM]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-b-transparent" />;
      default:
        return <SettingsIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">接続済み</Badge>;
      case 'error':
        return <Badge variant="destructive">未接続</Badge>;
      case 'testing':
        return <Badge variant="secondary">テスト中...</Badge>;
      default:
        return <Badge variant="outline">未確認</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64 pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
                <p className="text-gray-600">アプリケーションの設定を管理します</p>
              </div>

              <div className="space-y-6">
                {/* デプロイモード情報 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      デプロイモード
                    </CardTitle>
                    <CardDescription>
                      現在のデプロイメント設定と利用可能なモデル
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg border-2 ${isLiteMode ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <h4 className="font-medium text-green-800 mb-2">
                          🔋 Replit軽量モード {isLiteMode && <Badge variant="default">現在</Badge>}
                        </h4>
                        <div className="text-sm text-green-700 space-y-1">
                          <p>• tinymistralのみ（340MB）</p>
                          <p>• 1-2分で自動セットアップ</p>
                          <p>• 月額コスト: ~$1.4（DB のみ）</p>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-lg border-2 ${!isLiteMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                        <h4 className="font-medium text-blue-800 mb-2">
                          🚀 フルモード {!isLiteMode && <Badge variant="default">現在</Badge>}
                        </h4>
                        <div className="text-sm text-blue-700 space-y-1">
                          <p>• 全モデル対応（3.5GB）</p>
                          <p>• Docker/self-host 推奨</p>
                          <p>• 高品質なコンテンツ生成</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* WebGPU検出と推論モード */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      推論モード選択
                    </CardTitle>
                    <CardDescription>
                      WebGPU対応ブラウザでは自動的にブラウザ内推論を選択します
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg border-2 ${webGPUSupported ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                        <h4 className="font-medium text-blue-800 mb-2">
                          🌐 WebGPU ブラウザ推論 {webGPUSupported && <Badge variant="default">対応</Badge>}
                        </h4>
                        <div className="text-sm text-blue-700 space-y-1">
                          <p>• ブラウザ内で完結（プライベート）</p>
                          <p>• 軽量モデル（TinyLlama 1.1B）</p>
                          <p>• WebGPU必須</p>
                          <p>• 状態: {webGPUSupported ? '✅ 利用可能' : '❌ 未対応'}</p>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-lg border-2 ${!webGPUSupported ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <h4 className="font-medium text-green-800 mb-2">
                          🖥️ Ollama サーバー推論 {!webGPUSupported && <Badge variant="default">フォールバック</Badge>}
                        </h4>
                        <div className="text-sm text-green-700 space-y-1">
                          <p>• サーバーサイド推論</p>
                          <p>• tinymistral（340MB）</p>
                          <p>• 全ブラウザ対応</p>
                          <p>• 状態: {connectionStatus === 'success' ? '✅ 接続済み' : '⚠️ 未接続'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ローカルLLM設定 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      ローカルLLM設定
                    </CardTitle>
                    <CardDescription>
                      自動モード: WebGPU対応ブラウザ → ブラウザ推論、非対応 → Ollama推論
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ollama-url">Ollama URL</Label>
                      <Input
                        id="ollama-url"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Button 
                        onClick={handleTestConnection}
                        disabled={connectionStatus === 'testing'}
                        variant="outline"
                      >
                        {getStatusIcon()}
                        接続テスト
                      </Button>
                      {getStatusBadge()}
                    </div>

                    {(connectionStatus === 'error' || !isWebLLMReady()) && !isStartingOllama && !isInitializingWebLLM && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">ローカルLLMを起動</h4>
                        <div className="text-sm text-blue-700 space-y-3">
                          <p>
                            {webGPUSupported 
                              ? "WebGPU対応ブラウザです。ブラウザ内推論を開始します。" 
                              : "Ollamaサーバーをバックグラウンドで自動起動します。"}
                          </p>
                          <Button 
                            onClick={handleStartLLM}
                            disabled={isStartingOllama || isInitializingWebLLM}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {webGPUSupported ? <Monitor className="h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                            ローカルLLMを起動
                          </Button>
                          <div className="pt-2 border-t border-red-200">
                            <p className="text-xs">手動起動の場合：</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
                              <li>Ollamaをインストール: <code className="bg-red-100 px-1 rounded">brew install ollama</code></li>
                              <li>サーバーを起動: <code className="bg-red-100 px-1 rounded">ollama serve</code></li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WebLLM Progress */}
                    {isInitializingWebLLM && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-b-transparent" />
                            <span className="font-medium text-blue-700">WebLLM初期化中...</span>
                          </div>
                          
                          {webLLMProgress > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-blue-600">
                                <span>モデルダウンロード進捗</span>
                                <span>{Math.round(webLLMProgress)}%</span>
                              </div>
                              <Progress value={webLLMProgress} className="h-2" />
                            </div>
                          )}
                          
                          {startupProgress && (
                            <p className="text-sm text-blue-600">{startupProgress}</p>
                          )}
                          
                          <p className="text-xs text-blue-500">
                            初回セットアップ時はモデルダウンロードのため時間がかかります（TinyLlama 1.1B）
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Ollama Progress */}
                    {isStartingOllama && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-b-transparent" />
                            <div>
                              <h4 className="font-medium text-blue-800">ワンクリックセットアップ実行中</h4>
                              <p className="text-sm text-blue-700">{startupProgress}</p>
                            </div>
                          </div>
                          
                          {/* Phase indicator */}
                          <div className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${initPhase === 'start' ? 'bg-blue-500' : initPhase === 'pull' || initPhase === 'ready' ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>サーバー起動</span>
                            
                            <div className={`w-2 h-2 rounded-full ${initPhase === 'pull' ? 'bg-blue-500' : initPhase === 'ready' ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>モデル取得</span>
                            
                            <div className={`w-2 h-2 rounded-full ${initPhase === 'ready' ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>準備完了</span>
                          </div>
                          
                          {/* Model download progress */}
                          {initPhase === 'pull' && currentModel && (
                            <div className="space-y-2">
                              <div className="text-sm text-blue-800">
                                モデル取得中: <strong>{currentModel}</strong>
                              </div>
                              {downloadProgress[currentModel] && (
                                <div className="space-y-1">
                                  <Progress 
                                    value={downloadProgress[currentModel].percent || 0} 
                                    className="h-2" 
                                  />
                                  <div className="text-xs text-blue-600">
                                    {downloadProgress[currentModel].status} 
                                    {downloadProgress[currentModel].percent && ` (${downloadProgress[currentModel].percent}%)`}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Ready phase notification */}
                          {initPhase === 'ready' && (
                            <div className="text-sm text-green-800 bg-green-100 p-2 rounded">
                              🎉 セットアップ完了！まもなくチャット画面に移動します...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {connectionStatus === 'success' && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">ローカルLLMが正常に動作しています</p>
                        <p className="text-sm text-green-700 mt-1">
                          コンテンツ生成時にローカルLLMが使用され、サーバーコストが削減されます
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* その他の設定 */}
                <Card>
                  <CardHeader>
                    <CardTitle>その他の設定</CardTitle>
                    <CardDescription>
                      追加の設定項目は今後のアップデートで追加予定です
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">設定項目はありません</p>
                  </CardContent>
                </Card>

                {/* モデル管理 */}
                {connectionStatus === 'success' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        モデル管理
                      </CardTitle>
                      <CardDescription>
                        ローカルLLMモデルのダウンロードと管理を行います
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* 推奨モデル */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">推奨モデル</h4>
                        <div className="space-y-3">
                          {recommendedModels.map((model) => {
                            const isInstalled = models.some(m => m.name === model.name);
                            const progress = downloadProgress[model.name];
                            
                            return (
                              <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{model.name}</span>
                                    <Badge variant="outline" className="text-xs">{model.size}</Badge>
                                    {isInstalled && <Badge variant="default" className="text-xs bg-green-100 text-green-800">インストール済み</Badge>}
                                  </div>
                                  <p className="text-sm text-gray-600">{model.description}</p>
                                  
                                  {progress && (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                        <span>ダウンロード中...</span>
                                        {progress.total && progress.completed && (
                                          <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
                                        )}
                                      </div>
                                      <Progress 
                                        value={progress.total && progress.completed ? (progress.completed / progress.total) * 100 : 0}
                                        className="h-2"
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  {!isInstalled && !progress && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleDownloadModel(model.name)}
                                      disabled={!!progress}
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      ダウンロード
                                    </Button>
                                  )}
                                  {isInstalled && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteModel(model.name)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      削除
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* インストール済みモデル */}
                      {models.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">インストール済みモデル</h4>
                          <div className="space-y-2">
                            {models.filter(model => 
                              !recommendedModels.some(rec => rec.name === model.name)
                            ).map((model) => (
                              <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <span className="font-medium">{model.name}</span>
                                  {model.modified_at && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      最終更新: {new Date(model.modified_at).toLocaleDateString('ja-JP')}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteModel(model.name)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  削除
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {models.length === 0 && connectionStatus === 'success' && !isLoadingModels && (
                        <div className="text-center py-8 text-gray-500">
                          <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>インストール済みのモデルがありません</p>
                          <p className="text-sm">上記の推奨モデルをダウンロードしてください</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
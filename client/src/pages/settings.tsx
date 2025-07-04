import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Settings as SettingsIcon, Zap, Download, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { testOllamaConnection } from "@/lib/llm";
import { useToast } from "@/hooks/use-toast";

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
}

export default function Settings() {
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: DownloadProgress }>({});
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [startupProgress, setStartupProgress] = useState<string>('');
  const { toast } = useToast();

  const recommendedModels = [
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

  const handleStartOllama = async () => {
    try {
      setIsStartingOllama(true);
      setStartupProgress('サーバーを起動中...');
      
      const response = await fetch('/api/ollama/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 409) {
        toast({
          title: "既に起動済み",
          description: "Ollamaサーバーは既に起動しています",
        });
        await fetchOllamaStatus();
        setIsStartingOllama(false);
        setStartupProgress('');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to start Ollama server');
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
                
                if (data.message) {
                  setStartupProgress(data.message);
                }
                
                if (data.status === 'success') {
                  toast({
                    title: "起動完了",
                    description: "Ollamaサーバーが正常に起動しました",
                  });
                  await fetchOllamaStatus();
                } else if (data.status === 'error') {
                  throw new Error(data.message || '起動に失敗しました');
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
        title: "起動エラー",
        description: `Ollamaの起動に失敗しました: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsStartingOllama(false);
      setStartupProgress('');
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
    
    // Poll Ollama status every 10 seconds
    const pollInterval = setInterval(async () => {
      if (!isStartingOllama) {
        await fetchOllamaStatus();
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isStartingOllama]);

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
                {/* ローカルLLM設定 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      ローカルLLM設定
                    </CardTitle>
                    <CardDescription>
                      Ollamaを使用してローカルPC上でLLMを動作させることで、サーバーコストを削減できます
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

                    {connectionStatus === 'error' && !isStartingOllama && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">ローカルLLMが動いていません</h4>
                        <div className="text-sm text-red-700 space-y-3">
                          <p>バックグラウンドでOllamaサーバーを自動起動できます：</p>
                          <Button 
                            onClick={handleStartOllama}
                            disabled={isStartingOllama}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            サーバーを起動
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

                    {isStartingOllama && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-b-transparent" />
                          <div>
                            <h4 className="font-medium text-blue-800">Ollamaサーバーを起動中</h4>
                            <p className="text-sm text-blue-700">{startupProgress}</p>
                          </div>
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
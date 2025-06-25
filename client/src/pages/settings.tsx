import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Settings as SettingsIcon, Zap } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { testOllamaConnection } from "@/lib/llm";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    
    try {
      const isConnected = await testOllamaConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
        toast({
          title: "接続成功",
          description: "ローカルLLMとの接続が確認できました",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "接続失敗",
          description: "ローカルLLMに接続できませんでした",
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
    }
  };

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

                    {connectionStatus === 'error' && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Ollamaが起動していない可能性があります</h4>
                        <div className="text-sm text-red-700 space-y-1">
                          <p>以下の手順でOllamaを起動してください：</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Ollamaをインストール: <code className="bg-red-100 px-1 rounded">brew install ollama</code></li>
                            <li>モデルをダウンロード: <code className="bg-red-100 px-1 rounded">ollama pull tinymistral</code></li>
                            <li>サーバーを起動: <code className="bg-red-100 px-1 rounded">ollama serve</code></li>
                          </ol>
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
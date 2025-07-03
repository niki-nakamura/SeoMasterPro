import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle } from "lucide-react";

interface GenerationPreviewProps {
  step: number;
  data: {
    scrapeData?: {
      keyword: string;
      results: Array<{ title: string; domain: string }>;
    };
    personaData?: {
      analysis: {
        targetAudience: string;
        searchIntent: string;
        toneSuggestions: string;
      };
    };
    outlineData?: {
      outline: {
        title: string;
        sections: Array<{ heading: string; keyPoints: string[] }>;
      };
    };
    contentData?: {
      sections: { [key: string]: string };
      progress: number;
    };
    finalizeData?: {
      finalContent: string;
      metaTags: {
        metaTitle: string;
        metaDescription: string;
      };
      wordCount: number;
    };
  };
  isLoading?: boolean;
}

export function GenerationPreview({ step, data, isLoading }: GenerationPreviewProps) {
  const renderPreviewContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">スクレイピング結果</span>
            </div>
            {data.scrapeData ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  キーワード: <span className="font-medium">{data.scrapeData.keyword}</span>
                </p>
                <div className="space-y-1">
                  {data.scrapeData.results.slice(0, 3).map((result, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">
                        {result.domain}
                      </Badge>
                      <span className="text-slate-600 truncate">
                        {result.title.slice(0, 50)}...
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4 animate-spin" />
                競合サイトを分析中...
              </div>
            ) : (
              <p className="text-sm text-slate-400">スクレイピング待機中</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">ペルソナ分析</span>
            </div>
            {data.personaData ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-slate-700">ターゲット:</span>
                  <p className="text-slate-600 mt-1">{data.personaData.analysis.targetAudience}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">検索意図:</span>
                  <p className="text-slate-600 mt-1">{data.personaData.analysis.searchIntent}</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4 animate-spin" />
                ペルソナを分析中...
              </div>
            ) : (
              <p className="text-sm text-slate-400">分析待機中</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">アウトライン</span>
            </div>
            {data.outlineData ? (
              <div className="space-y-2">
                <h4 className="font-medium text-slate-700">{data.outlineData.outline.title}</h4>
                <div className="space-y-1">
                  {data.outlineData.outline.sections.slice(0, 3).map((section, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium text-slate-600">{section.heading}</span>
                      <div className="ml-2 text-slate-500">
                        {section.keyPoints.slice(0, 2).map((point, j) => (
                          <div key={j}>• {point.slice(0, 40)}...</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4 animate-spin" />
                アウトラインを作成中...
              </div>
            ) : (
              <p className="text-sm text-slate-400">作成待機中</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">コンテンツ生成</span>
              {data.contentData && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(data.contentData.progress)}%
                </Badge>
              )}
            </div>
            {data.contentData ? (
              <ScrollArea className="h-32">
                <div className="space-y-2 text-xs">
                  {Object.entries(data.contentData.sections).map(([key, content]) => (
                    <div key={key} className="border-l-2 border-orange-200 pl-2">
                      <span className="font-medium text-slate-600">{key}</span>
                      <p className="text-slate-500 mt-1">
                        {content.slice(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4 animate-spin" />
                コンテンツを生成中...
              </div>
            ) : (
              <p className="text-sm text-slate-400">生成待機中</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">最終化完了</span>
            </div>
            {data.finalizeData ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-slate-700">タイトル:</span>
                  <p className="text-slate-600 mt-1">{data.finalizeData.metaTags.metaTitle}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">説明:</span>
                  <p className="text-slate-600 mt-1">{data.finalizeData.metaTags.metaDescription}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {data.finalizeData.wordCount} 文字
                </Badge>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4 animate-spin" />
                最終化処理中...
              </div>
            ) : (
              <p className="text-sm text-slate-400">最終化待機中</p>
            )}
          </div>
        );

      default:
        return <p className="text-sm text-slate-400">準備中...</p>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">生成プレビュー</h3>
        <Badge variant={isLoading ? "default" : "secondary"} className="text-xs">
          {isLoading ? "処理中" : "待機中"}
        </Badge>
      </div>
      
      <div className="min-h-[120px]">
        {renderPreviewContent()}
      </div>
    </div>
  );
}
import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    console.log('AuthCallback component mounted');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    
    const handleAuthCallback = async () => {
      try {
        // URLからパラメータ取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        console.log('Auth code from URL:', code);
        
        if (code) {
          console.log('Processing auth code with Supabase...');
          // 認証コードをセッションに交換（モッククライアントでも実行）
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Auth callback error:', error.message);
            // エラーでもダッシュボードに遷移（開発用）
            console.log('Redirecting to dashboard despite error (development mode)');
            navigate('/');
            return;
          }
          
          if (data.session) {
            console.log('Authentication successful');
            navigate('/');
          } else {
            console.log('No session returned, redirecting to dashboard');
            navigate('/');
          }
        } else {
          console.error('No auth code found in URL');
          // 3秒後にリダイレクト
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            認証中...
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            GitHubからのログインを処理しています
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
}
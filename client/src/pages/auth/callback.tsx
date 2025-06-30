import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからパラメータ取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          // Supabaseクライアントが利用可能な場合のみ処理
          if (supabase && typeof supabase.auth.exchangeCodeForSession === 'function') {
            // 認証コードをセッションに交換
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error('Auth callback error:', error.message);
              navigate('/');
              return;
            }
            
            if (data.session) {
              console.log('Authentication successful');
              // ダッシュボードに遷移
              navigate('/');
            }
          } else {
            console.log('Supabase not configured, redirecting to dashboard');
            navigate('/');
          }
        } else {
          console.error('No auth code found in URL');
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        navigate('/');
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
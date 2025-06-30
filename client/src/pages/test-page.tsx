export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          テストページ
        </h1>
        <p className="text-gray-600">
          このページが表示されていれば、ルーティングは正常に動作しています。
        </p>
        <p className="text-sm text-gray-500 mt-4">
          URL: {window.location.href}
        </p>
      </div>
    </div>
  );
}
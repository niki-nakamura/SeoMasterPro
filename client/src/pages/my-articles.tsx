import { useQuery } from "@tanstack/react-query";
import { ArticleTable } from "@/components/articles/article-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import type { Article } from "@shared/schema";

export default function MyArticles() {
  const { data: articles = [], isLoading, refetch } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete article");
      }

      // Refresh the articles list
      refetch();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Articles
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your generated content and drafts
          </p>
        </div>
        <Link href="/content-generator">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Article
          </Button>
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No articles yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Get started by creating your first SEO-optimized article
          </p>
          <Link href="/content-generator">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Article
            </Button>
          </Link>
        </div>
      ) : (
        <ArticleTable articles={articles} onDelete={handleDelete} />
      )}
    </div>
  );
}
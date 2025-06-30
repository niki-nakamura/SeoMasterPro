// Vector search service for content similarity
import { db } from '../db';
import { contentVectors, articlesRaw } from '@shared/schema';
import { sql } from 'drizzle-orm';

export interface VectorSearchResult {
  id: number;
  content: string;
  similarity: number;
  url: string;
  title: string;
}

export async function searchSimilarContent(
  queryText: string, 
  limit: number = 7
): Promise<VectorSearchResult[]> {
  try {
    // 簡易的なキーワードベース検索（実際のベクトル検索の代替）
    const keywords = queryText.toLowerCase().split(' ').filter(word => word.length > 2);
    
    if (keywords.length === 0) {
      return [];
    }
    
    // PostgreSQL LIKE検索でHTMLコンテンツを抽出
    const searchConditions = keywords.map(keyword => 
      sql`LOWER(${articlesRaw.html}) LIKE ${`%${keyword}%`}`
    );
    
    const results = await db
      .select({
        id: articlesRaw.id,
        content: articlesRaw.html,
        url: articlesRaw.url,
        title: articlesRaw.title
      })
      .from(articlesRaw)
      .where(sql`${searchConditions.reduce((acc, condition) => 
        acc ? sql`${acc} OR ${condition}` : condition
      )}`)
      .limit(limit);

    // 簡易的な類似度スコア（キーワードマッチ数ベース）
    return results.map(result => ({
      ...result,
      similarity: keywords.filter(keyword => 
        result.content.toLowerCase().includes(keyword)
      ).length / keywords.length
    })).sort((a, b) => b.similarity - a.similarity);
    
  } catch (error) {
    console.error('Vector search failed:', error);
    return [];
  }
}

// pgvector TOP-k検索機能
export async function getTopKContent(
  queryEmbedding: number[], 
  k: number = 7
): Promise<VectorSearchResult[]> {
  try {
    // pgvectorを使用したコサイン類似度検索
    const results = await db.execute(sql`
      SELECT 
        id, 
        content, 
        url, 
        title,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      FROM content_vectors
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector ASC
      LIMIT ${k}
    `);

    return results.rows.map(row => ({
      id: row.id as number,
      content: row.content as string,
      url: row.url as string,
      title: row.title as string,
      similarity: row.similarity as number
    }));
  } catch (error) {
    console.error('pgvector TOP-k search failed:', error);
    // フォールバック：キーワードベース検索
    return searchSimilarContent(queryEmbedding.join(' '), k);
  }
}

export async function extractTopKContent(
  keyword: string,
  k: number = 7
): Promise<string[]> {
  const results = await searchSimilarContent(keyword, k);
  
  return results.map(result => 
    `タイトル: ${result.title}\nURL: ${result.url}\n内容: ${result.content.slice(0, 1000)}...`
  );
}
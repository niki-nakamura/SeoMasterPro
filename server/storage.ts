import { 
  articles, 
  scrapedUrls,
  type Article, 
  type InsertArticle,
  type ScrapedUrl,
  type InsertScrapedUrl 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Articles
  getArticle(id: number): Promise<Article | undefined>;
  getAllArticles(): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, updates: Partial<Article>): Promise<Article>;
  deleteArticle(id: number): Promise<void>;
  
  // Scraped URLs
  getScrapedUrlsByArticleId(articleId: number): Promise<ScrapedUrl[]>;
  createScrapedUrl(scrapedUrl: InsertScrapedUrl): Promise<ScrapedUrl>;
  deleteScrapedUrlsByArticleId(articleId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article || undefined;
  }

  async getAllArticles(): Promise<Article[]> {
    return await db.select().from(articles).orderBy(desc(articles.updatedAt));
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db
      .insert(articles)
      .values({
        ...insertArticle,
        updatedAt: new Date(),
      })
      .returning();
    return article;
  }

  async updateArticle(id: number, updates: Partial<Article>): Promise<Article> {
    const [article] = await db
      .update(articles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    return article;
  }

  async deleteArticle(id: number): Promise<void> {
    await db.delete(scrapedUrls).where(eq(scrapedUrls.articleId, id));
    await db.delete(articles).where(eq(articles.id, id));
  }

  async getScrapedUrlsByArticleId(articleId: number): Promise<ScrapedUrl[]> {
    return await db.select().from(scrapedUrls).where(eq(scrapedUrls.articleId, articleId));
  }

  async createScrapedUrl(scrapedUrl: InsertScrapedUrl): Promise<ScrapedUrl> {
    const [url] = await db
      .insert(scrapedUrls)
      .values(scrapedUrl)
      .returning();
    return url;
  }

  async deleteScrapedUrlsByArticleId(articleId: number): Promise<void> {
    await db.delete(scrapedUrls).where(eq(scrapedUrls.articleId, articleId));
  }
}

export const storage = new DatabaseStorage();

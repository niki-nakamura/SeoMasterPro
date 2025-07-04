import { pgTable, text, serial, integer, boolean, timestamp, jsonb, vector } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  targetKeyword: text("target_keyword").notNull(),
  industry: text("industry").notNull(),
  contentType: text("content_type").notNull(),
  additionalContext: text("additional_context"),
  currentStep: integer("current_step").notNull().default(1),
  
  // Step results
  scrapedResults: jsonb("scraped_results"),
  personaAnalysis: jsonb("persona_analysis"),
  outline: jsonb("outline"),
  content: jsonb("content"),
  metaTags: jsonb("meta_tags"),
  
  // Final content
  finalTitle: text("final_title"),
  finalContent: text("final_content"),
  metaDescription: text("meta_description"),
  
  status: text("status").notNull().default("draft"), // draft, published
  wordCount: integer("word_count"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scrapedUrls = pgTable("scraped_urls", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  domain: text("domain"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Raw articles table for storing scraped HTML content
export const articlesRaw = pgTable("articles_raw", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  html: text("html").notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
});

// Vector embeddings for semantic search
export const contentVectors = pgTable("content_vectors", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScrapedUrlSchema = createInsertSchema(scrapedUrls).omit({
  id: true,
  createdAt: true,
});

export const insertArticlesRawSchema = createInsertSchema(articlesRaw).omit({
  id: true,
  fetchedAt: true,
});

export const updateArticleSchema = insertArticleSchema.partial();

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertScrapedUrl = z.infer<typeof insertScrapedUrlSchema>;
export type ScrapedUrl = typeof scrapedUrls.$inferSelect;
export type InsertArticlesRaw = z.infer<typeof insertArticlesRawSchema>;
export type ArticlesRaw = typeof articlesRaw.$inferSelect;

// Workflow step schemas
export const scrapeRequestSchema = z.object({
  keyword: z.string().min(1),
  maxResults: z.number().default(8),
});

export const personaRequestSchema = z.object({
  articleId: z.number(),
  targetKeyword: z.string(),
  industry: z.string(),
  contentType: z.string(),
  additionalContext: z.string().optional(),
});

export const outlineRequestSchema = z.object({
  articleId: z.number(),
});

export const generateContentRequestSchema = z.object({
  articleId: z.number(),
  section: z.string().optional(),
});

export const finalizeRequestSchema = z.object({
  articleId: z.number(),
});

export type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;
export type PersonaRequest = z.infer<typeof personaRequestSchema>;
export type OutlineRequest = z.infer<typeof outlineRequestSchema>;
export type GenerateContentRequest = z.infer<typeof generateContentRequestSchema>;
export type FinalizeRequest = z.infer<typeof finalizeRequestSchema>;

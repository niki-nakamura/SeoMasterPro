#!/usr/bin/env tsx

import OpenAI from "openai";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { articlesRaw, contentVectors } from "../shared/schema.js";
import { desc } from "drizzle-orm";
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { articlesRaw, contentVectors } });

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

async function extractTextFromHtml(html: string): Promise<string> {
  // Simple HTML tag removal - in production you might want to use a proper HTML parser
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function embedExistingArticles() {
  console.log("🚀 Starting embedding process for existing articles...");

  try {
    // Fetch latest 3 articles from articles_raw
    console.log("📖 Fetching latest 3 articles from articles_raw...");
    const articles = await db
      .select()
      .from(articlesRaw)
      .orderBy(desc(articlesRaw.fetchedAt))
      .limit(3);

    if (articles.length === 0) {
      console.log("⚠️  No articles found in articles_raw table");
      return;
    }

    console.log(`📄 Found ${articles.length} articles to process`);

    for (const article of articles) {
      console.log(`\n🔄 Processing article: ${article.title}`);
      console.log(`🔗 URL: ${article.url}`);

      // Extract text content from HTML
      const textContent = await extractTextFromHtml(article.html);

      // Limit content to reasonable size for embedding (max ~8000 chars)
      const contentForEmbedding = textContent.slice(0, 8000);

      if (contentForEmbedding.length < 50) {
        console.log("⚠️  Content too short, skipping...");
        continue;
      }

      console.log(
        `📝 Content length: ${contentForEmbedding.length} characters`,
      );

      // Generate embedding
      console.log("🧠 Generating embedding with OpenAI...");
      const embedding = await generateEmbedding(contentForEmbedding);

      // Insert into contentVectors table
      console.log("💾 Saving to contentVectors table...");
      await db.insert(contentVectors).values({
        title: article.title,
        content: contentForEmbedding,
        embedding: embedding,
      });

      console.log("✅ Successfully embedded and saved");

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n🎉 Embedding process completed successfully!");
  } catch (error) {
    console.error("❌ Error during embedding process:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the embedding process
embedExistingArticles();

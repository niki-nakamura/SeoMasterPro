#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { articlesRaw, contentVectors } from "../shared/schema.js";
import { desc } from "drizzle-orm";
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { articlesRaw, contentVectors } });

async function testEmbedSetup() {
  console.log("🧪 Testing embed setup...");
  
  try {
    // Test database connection
    console.log("📊 Testing database connection...");
    const articles = await db
      .select()
      .from(articlesRaw)
      .orderBy(desc(articlesRaw.fetchedAt))
      .limit(3);
    
    console.log(`✅ Found ${articles.length} articles in articles_raw`);
    
    // Test contentVectors table structure
    console.log("📋 Testing contentVectors table structure...");
    const vectorCount = await db
      .select()
      .from(contentVectors)
      .limit(1);
      
    console.log("✅ contentVectors table is accessible");
    
    // Show article details
    for (const article of articles) {
      console.log(`📄 Article: ${article.title.slice(0, 60)}...`);
      console.log(`🔗 URL: ${article.url}`);
      console.log(`📝 HTML length: ${article.html.length} characters`);
    }
    
    console.log("\n🎉 Embed setup test completed successfully!");
    console.log("💡 To run the actual embedding process, you'll need:");
    console.log("   1. Valid OpenAI API key with sufficient quota");
    console.log("   2. Run: tsx scripts/embed_existing_articles.ts");
    
  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    await pool.end();
  }
}

testEmbedSetup();
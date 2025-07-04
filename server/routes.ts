import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertArticleSchema,
  updateArticleSchema,
  scrapeRequestSchema,
  personaRequestSchema,
  outlineRequestSchema,
  generateContentRequestSchema,
  finalizeRequestSchema,
  articlesRaw,
  contentVectors
} from "@shared/schema";
import { db } from "./db";
import { desc, eq, sql } from "drizzle-orm";
import { scrapeSearchResults } from "./services/scraper";
import { 
  generatePersonaAndIntent, 
  generateContentOutline, 
  generateSectionContent,
  generateMetaTags
} from "./services/openai";
import { generateWithOllama, type OllamaRequest } from "./services/ollama";
import { searchSimilarContent, extractTopKContent } from "./services/vector-search";

// LLM Context types and functions
interface LLMContextResult {
  id: number;
  content: string;
  similarity: number;
}

interface LLMContextResponse {
  contextText: string;
  sources: LLMContextResult[];
  count: number;
}

async function getLLMContext(keyword: string, k: number = 7): Promise<LLMContextResponse> {
  try {
    // Use HNSW index for efficient vector similarity search
    const results = await db.execute(sql`
      WITH keyword_vector AS (
        SELECT embedding 
        FROM content_vectors 
        WHERE content ILIKE ${`%${keyword}%`} 
        ORDER BY LENGTH(content) DESC 
        LIMIT 1
      )
      SELECT 
        cv.id, 
        cv.title,
        cv.content,
        1 - (cv.embedding <=> kv.embedding) as similarity
      FROM content_vectors cv, keyword_vector kv
      ORDER BY cv.embedding <=> kv.embedding
      LIMIT ${k}
    `);

    const sources: LLMContextResult[] = results.rows.map(row => ({
      id: row.id as number,
      content: row.content as string,
      similarity: (row.similarity as number) || 0
    }));

    // コンテキストテキストを生成
    const contextText = sources
      .map((result, index) => `[参考${index + 1}] ${result.content.slice(0, 800)}...`)
      .join('\n\n---\n\n');

    return {
      contextText,
      sources,
      count: sources.length
    };

  } catch (error) {
    console.error('LLM context retrieval failed:', error);
    // フォールバック：キーワードベース検索
    const fallbackResults = await searchSimilarContent(keyword, k);
    const contextText = fallbackResults
      .map((result, index) => `[参考${index + 1}] ${result.content.slice(0, 800)}...`)
      .join('\n\n---\n\n');
    
    return {
      contextText,
      sources: fallbackResults.map(r => ({
        id: r.id,
        content: r.content,
        similarity: r.similarity
      })),
      count: fallbackResults.length
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Articles CRUD
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      const validatedData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      res.status(400).json({ message: "Invalid article data", error: (error as Error).message });
    }
  });

  app.patch("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateArticleSchema.parse(req.body);
      const article = await storage.updateArticle(id, validatedData);
      res.json(article);
    } catch (error) {
      res.status(400).json({ message: "Failed to update article", error: (error as Error).message });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteArticle(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Workflow Step 1: Scrape - Enhanced with database storage
  app.post("/api/scrape", async (req, res) => {
    try {
      const { keyword, maxResults = 8 } = scrapeRequestSchema.parse(req.body);
      
      console.log(`Starting scraping for keyword: ${keyword}`);
      const scrapedResults = await scrapeSearchResults(keyword, maxResults);
      
      res.json({
        results: scrapedResults,
        count: scrapedResults.length,
        message: `Successfully scraped ${scrapedResults.length} articles and saved to database`
      });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({ 
        message: "Web scraping failed", 
        error: (error as Error).message 
      });
    }
  });

  // Workflow Step 2: Persona & Intent
  app.post("/api/generate-persona", async (req, res) => {
    try {
      const data = personaRequestSchema.parse(req.body);
      
      // Get article and scraped data
      const article = await storage.getArticle(data.articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const scrapedUrls = await storage.getScrapedUrlsByArticleId(data.articleId);
      const competitorData = scrapedUrls.map(url => `${url.title}: ${url.content?.substring(0, 500)}`);
      
      const personaAnalysis = await generatePersonaAndIntent({
        targetKeyword: data.targetKeyword,
        industry: data.industry,
        contentType: data.contentType,
        additionalContext: data.additionalContext,
        competitorData
      });
      
      // Update article with persona analysis
      const updatedArticle = await storage.updateArticle(data.articleId, {
        targetKeyword: data.targetKeyword,
        industry: data.industry,
        contentType: data.contentType,
        additionalContext: data.additionalContext,
        personaAnalysis,
        currentStep: 3
      });
      
      res.json({
        article: updatedArticle,
        personaAnalysis
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate persona analysis", 
        error: (error as Error).message 
      });
    }
  });

  // Workflow Step 3: Outline
  app.post("/api/generate-outline", async (req, res) => {
    try {
      const { articleId } = outlineRequestSchema.parse(req.body);
      
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const scrapedUrls = await storage.getScrapedUrlsByArticleId(articleId);
      const competitorData = scrapedUrls.map(url => `${url.title}: ${url.content?.substring(0, 500)}`);
      
      const outline = await generateContentOutline({
        targetKeyword: article.targetKeyword,
        personaAnalysis: article.personaAnalysis,
        competitorData
      });
      
      const updatedArticle = await storage.updateArticle(articleId, {
        outline,
        currentStep: 4
      });
      
      res.json({
        article: updatedArticle,
        outline
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate outline", 
        error: (error as Error).message 
      });
    }
  });

  // Workflow Step 4: Generate Content
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { articleId, section } = generateContentRequestSchema.parse(req.body);
      
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      if (!section) {
        // Generate all sections
        const outline = article.outline as any;
        const generatedContent: { [key: string]: string } = {};
        
        for (const outlineSection of outline.sections) {
          const content = await generateSectionContent({
            section: outlineSection,
            targetKeyword: article.targetKeyword,
            personaAnalysis: article.personaAnalysis,
            outline: article.outline
          });
          generatedContent[outlineSection.heading] = content;
        }
        
        const updatedArticle = await storage.updateArticle(articleId, {
          content: generatedContent,
          currentStep: 5
        });
        
        res.json({
          article: updatedArticle,
          content: generatedContent
        });
      } else {
        // Generate specific section
        const outline = article.outline as any;
        const targetSection = outline.sections.find((s: any) => s.heading === section);
        
        if (!targetSection) {
          return res.status(400).json({ message: "Section not found in outline" });
        }
        
        const content = await generateSectionContent({
          section: targetSection,
          targetKeyword: article.targetKeyword,
          personaAnalysis: article.personaAnalysis,
          outline: article.outline
        });
        
        res.json({ content });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate content", 
        error: (error as Error).message 
      });
    }
  });

  // Workflow Step 5: Finalize
  app.post("/api/finalize", async (req, res) => {
    try {
      const { articleId } = finalizeRequestSchema.parse(req.body);
      
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const outline = article.outline as any;
      const content = article.content as any;
      
      // Compile final content
      let finalContent = `# ${outline.title}\n\n`;
      finalContent += `${outline.introduction}\n\n`;
      
      for (const section of outline.sections) {
        if (content[section.heading]) {
          finalContent += content[section.heading] + '\n\n';
        }
      }
      
      finalContent += outline.conclusion;
      
      // Generate meta tags
      const metaTags = await generateMetaTags({
        title: outline.title,
        content: finalContent,
        targetKeyword: article.targetKeyword
      });
      
      const wordCount = finalContent.split(/\s+/).length;
      
      const updatedArticle = await storage.updateArticle(articleId, {
        finalTitle: outline.title,
        finalContent,
        metaTags,
        metaDescription: metaTags.metaDescription,
        wordCount,
        status: "published",
        currentStep: 5
      });
      
      res.json({
        article: updatedArticle,
        metaTags
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to finalize article", 
        error: (error as Error).message 
      });
    }
  });

  // Get scraped URLs for an article
  app.get("/api/articles/:id/scraped-urls", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const urls = await storage.getScrapedUrlsByArticleId(articleId);
      res.json(urls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scraped URLs" });
    }
  });

  // Save scraped URLs for an article
  app.post("/api/articles/:id/scraped-urls", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const { results } = req.body;
      
      // Clear existing scraped URLs
      await storage.deleteScrapedUrlsByArticleId(articleId);
      
      // Save new scraped URLs
      const savedUrls = [];
      for (const result of results) {
        const savedUrl = await storage.createScrapedUrl({
          articleId,
          url: result.url,
          title: result.title,
          content: result.content,
          domain: result.domain
        });
        savedUrls.push(savedUrl);
      }
      
      res.json(savedUrls);
    } catch (error) {
      res.status(500).json({ message: "Failed to save scraped URLs" });
    }
  });

  // Get raw articles from database
  app.get("/api/articles-raw", async (req, res) => {
    try {
      const rawArticles = await db
        .select()
        .from(articlesRaw)
        .orderBy(desc(articlesRaw.fetchedAt))
        .limit(50);
      
      res.json(rawArticles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch raw articles" });
    }
  });

  // Get specific raw article by URL
  app.get("/api/articles-raw/by-url", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      const rawArticle = await db
        .select()
        .from(articlesRaw)
        .where(eq(articlesRaw.url, url))
        .limit(1);

      if (rawArticle.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(rawArticle[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch raw article" });
    }
  });

  // LLM Context API - pgvector TOP-k content retrieval
  app.post("/api/llm-context", async (req, res) => {
    try {
      const { keyword } = req.body;
      
      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      const context = await getLLMContext(keyword, 7);
      res.json(context);
    } catch (error) {
      console.error("LLM context error:", error);
      res.status(500).json({ 
        message: "LLM context retrieval failed", 
        error: (error as Error).message 
      });
    }
  });

  // Vector Search API
  app.post("/api/vector-search", async (req, res) => {
    try {
      const { keyword, k = 7 } = req.body;
      
      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      const results = await searchSimilarContent(keyword, k);
      res.json({ results, count: results.length });
    } catch (error) {
      console.error("Vector search error:", error);
      res.status(500).json({ 
        message: "Vector search failed", 
        error: (error as Error).message 
      });
    }
  });

  // Ollama LLM Proxy (enhanced with vector context)
  app.post("/proxy/llm", async (req, res) => {
    try {
      const { prompt, model, useContext, keyword } = req.body as OllamaRequest & {
        useContext?: boolean;
        keyword?: string;
      };
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      let enhancedPrompt = prompt;
      
      // TOP-k ベクトル検索でコンテキストを追加
      if (useContext && keyword) {
        try {
          const topKContent = await extractTopKContent(keyword, 7);
          if (topKContent.length > 0) {
            const contextData = topKContent.join('\n\n---\n\n');
            enhancedPrompt = `以下の参考記事を踏まえて回答してください：

${contextData}

---

質問: ${prompt}`;
          }
        } catch (contextError) {
          console.log('ベクトルコンテキスト取得をスキップ:', contextError);
        }
      }

      const result = await generateWithOllama({ prompt: enhancedPrompt, model });
      res.json(result);
    } catch (error) {
      console.error("Ollama proxy error:", error);
      res.status(500).json({ 
        message: "LLM generation failed", 
        error: (error as Error).message 
      });
    }
  });

  // Ollama management endpoints
  app.get("/api/ollama/status", async (req, res) => {
    try {
      const { ollamaManager } = await import("./services/ollama-manager");
      const status = await ollamaManager.checkStatus();
      res.json(status);
    } catch (error) {
      res.json({ running: false, models: [] });
    }
  });

  app.post("/api/ollama/start", async (req, res) => {
    try {
      const { ollamaManager } = await import("./services/ollama-manager");
      
      // Check if already running
      const status = await ollamaManager.checkStatus();
      if (status.running) {
        return res.status(409).json({ 
          error: "Ollama is already running",
          running: true,
          pid: status.pid 
        });
      }

      // Set SSE headers for streaming start progress
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      res.write(`data: ${JSON.stringify({ status: "starting", message: "Ollamaサーバーを起動中..." })}\n\n`);

      // Start Ollama
      const result = await ollamaManager.start();
      
      if (result.success) {
        res.write(`data: ${JSON.stringify({ status: "starting", message: "サーバーの準備を確認中..." })}\n\n`);
        
        // Wait for Ollama to be ready
        const isReady = await ollamaManager.waitForReady(30000);
        
        if (isReady) {
          const finalStatus = await ollamaManager.checkStatus();
          res.write(`data: ${JSON.stringify({ 
            status: "success", 
            message: "Ollamaサーバーが正常に起動しました",
            running: true,
            pid: result.pid,
            models: finalStatus.models || []
          })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ 
            status: "error", 
            message: "サーバーの起動に時間がかかっています。再試行してください。"
          })}\n\n`);
        }
      } else {
        res.write(`data: ${JSON.stringify({ 
          status: "error", 
          message: result.error || "サーバーの起動に失敗しました"
        })}\n\n`);
      }
      
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ 
        status: "error", 
        message: `起動エラー: ${(error as Error).message}`
      })}\n\n`);
      res.end();
    }
  });

  app.post("/api/ollama/stop", async (req, res) => {
    try {
      const { ollamaManager } = await import("./services/ollama-manager");
      const result = await ollamaManager.stop();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  });

  app.post("/api/ollama/init", async (req, res) => {
    try {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*"
      });

      const { ollamaManager } = await import("./services/ollama-manager");
      await ollamaManager.initialize(res);
      
      res.end();
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ 
        message: `初期化エラー: ${(error as Error).message}`
      })}\n\n`);
      res.end();
    }
  });

  app.post("/api/ollama/chat", async (req, res) => {
    try {
      const { model = "tinymistral", messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      // Check if Ollama is running and model is available
      const { ollamaManager } = await import("./services/ollama-manager");
      const status = await ollamaManager.checkStatus();
      
      if (!status.running) {
        return res.status(503).json({ 
          error: "Ollama server is not running",
          action: "start_server"
        });
      }

      const modelExists = status.models?.some(m => m.name === model);
      if (!modelExists) {
        return res.status(404).json({ 
          error: `Model ${model} is not installed`,
          requiredModel: model,
          action: "install_model"
        });
      }

      // Set SSE headers for streaming chat
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model, 
          messages,
          stream: true 
        }),
      });

      if (!response.ok) {
        res.write(`data: ${JSON.stringify({ error: "Failed to connect to Ollama" })}\n\n`);
        res.end();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        res.write(`data: ${JSON.stringify({ error: "No response stream" })}\n\n`);
        res.end();
        return;
      }

      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              res.write(`data: ${JSON.stringify(data)}\n\n`);
              
              if (data.done) {
                res.end();
                return;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      } finally {
        reader.releaseLock();
        res.end();
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
      res.end();
    }
  });

  app.post("/api/ollama/pull", async (req, res) => {
    try {
      const { model } = req.body;
      if (!model) {
        return res.status(400).json({ error: "Model name is required" });
      }

      // Set SSE headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const response = await fetch("http://localhost:11434/api/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: model, stream: true }),
      });

      if (!response.ok) {
        res.write(`data: ${JSON.stringify({ error: "Failed to start download" })}\n\n`);
        res.end();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        res.write(`data: ${JSON.stringify({ error: "No response stream" })}\n\n`);
        res.end();
        return;
      }

      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              res.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      } finally {
        reader.releaseLock();
        res.end();
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
      res.end();
    }
  });

  app.delete("/api/ollama/models/:model", async (req, res) => {
    try {
      const { model } = req.params;
      const response = await fetch("http://localhost:11434/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: model }),
      });

      if (!response.ok) {
        return res.status(500).json({ error: "Failed to delete model" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

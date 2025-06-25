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
  articlesRaw
} from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import { scrapeSearchResults } from "./services/scraper";
import { 
  generatePersonaAndIntent, 
  generateContentOutline, 
  generateSectionContent,
  generateMetaTags
} from "./services/openai";

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

  // Ollama LLM Proxy
  app.post("/proxy/llm", async (req, res) => {
    try {
      const { prompt, model } = req.body as OllamaRequest;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const result = await generateWithOllama({ prompt, model });
      res.json(result);
    } catch (error) {
      console.error("Ollama proxy error:", error);
      res.status(500).json({ 
        message: "LLM generation failed", 
        error: (error as Error).message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

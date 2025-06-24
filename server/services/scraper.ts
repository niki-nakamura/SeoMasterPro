import { chromium } from "playwright";

export interface ScrapedResult {
  url: string;
  title: string;
  content: string;
  domain: string;
}

export async function scrapeSearchResults(keyword: string, maxResults: number = 8): Promise<ScrapedResult[]> {
  let browser;
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Search on Google
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=${maxResults + 2}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle' });
    
    // Extract search results
    const searchResults = await page.evaluate(() => {
      const results: Array<{ url: string; title: string }> = [];
      const resultElements = document.querySelectorAll('div[data-ved] h3');
      
      resultElements.forEach((element) => {
        const linkElement = element.closest('a');
        if (linkElement) {
          const url = linkElement.href;
          const title = element.textContent || '';
          
          // Filter out Google's own pages and ads
          if (!url.includes('google.com') && !url.includes('youtube.com') && title) {
            results.push({ url, title });
          }
        }
      });
      
      return results;
    });
    
    const scrapedResults: ScrapedResult[] = [];
    
    // Scrape content from each result
    for (const result of searchResults.slice(0, maxResults)) {
      try {
        const resultPage = await context.newPage();
        await resultPage.goto(result.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Extract main content
        const content = await resultPage.evaluate(() => {
          // Try different selectors for main content
          const selectors = [
            'main',
            'article',
            '[role="main"]',
            '.content',
            '.post-content',
            '.entry-content',
            '.article-content',
            'body'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              // Remove script, style, nav, header, footer elements
              const clone = element.cloneNode(true) as Element;
              clone.querySelectorAll('script, style, nav, header, footer, .nav, .navigation, .sidebar').forEach(el => el.remove());
              
              const text = clone.textContent || '';
              if (text.length > 200) {
                return text.replace(/\s+/g, ' ').trim().substring(0, 2000);
              }
            }
          }
          
          return '';
        });
        
        const domain = new URL(result.url).hostname;
        
        if (content) {
          scrapedResults.push({
            url: result.url,
            title: result.title,
            content,
            domain
          });
        }
        
        await resultPage.close();
      } catch (error) {
        console.error(`Failed to scrape ${result.url}:`, error);
        // Continue with other URLs
      }
    }
    
    return scrapedResults;
    
  } catch (error) {
    throw new Error(`Web scraping failed: ${(error as Error).message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

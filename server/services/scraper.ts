import * as cheerio from "cheerio";
import { db } from "../db";
import { articlesRaw } from "@shared/schema";

export interface ScrapedResult {
  url: string;
  title: string;
  content: string;
  domain: string;
}

// User-Agent配列でランダム化
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// HTTPベースのGoogle検索スクレイピング（Replit対応版）
export async function scrapeSearchResults(keyword: string, maxResults: number = 8): Promise<ScrapedResult[]> {
  try {
    console.log(`Starting HTTP-based scraping for keyword: ${keyword}`);
    
    // DuckDuckGoを使用（より安定でアクセス可能）
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.status}`);
    }

    const searchHtml = await searchResponse.text();
    const $ = cheerio.load(searchHtml);
    
    // DuckDuckGoの検索結果を解析
    const searchResults: Array<{ url: string; title: string }> = [];
    
    $('.result__title a').each((i, elem) => {
      const href = $(elem).attr('href');
      const title = $(elem).text().trim();
      
      if (href && title && !href.includes('duckduckgo.com')) {
        // DuckDuckGoのリダイレクトURLをデコード
        let cleanUrl = href;
        if (href.startsWith('/l/?uddg=')) {
          try {
            const urlParams = new URLSearchParams(href.split('?')[1]);
            cleanUrl = decodeURIComponent(urlParams.get('uddg') || href);
          } catch (e) {
            cleanUrl = href;
          }
        }
        
        searchResults.push({ url: cleanUrl, title });
      }
    });

    console.log(`Found ${searchResults.length} search results from DuckDuckGo`);
    const scrapedResults: ScrapedResult[] = [];
    
    // 各URLをスクレイピング（3秒遅延付き）
    for (let i = 0; i < Math.min(searchResults.length, maxResults); i++) {
      const result = searchResults[i];
      
      try {
        console.log(`Scraping ${i + 1}/${maxResults}: ${result.url}`);
        
        const pageResponse = await fetch(result.url, {
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(15000) // 15秒タイムアウト
        });

        if (!pageResponse.ok) {
          console.warn(`Failed to fetch ${result.url}: ${pageResponse.status}`);
          continue;
        }

        const html = await pageResponse.text();
        const page$ = cheerio.load(html);
        
        // 不要な要素を削除
        page$('script, style, nav, header, footer, .nav, .navigation, .sidebar, .ad, .advertisement, .comments').remove();
        
        // メインコンテンツを抽出
        const selectors = [
          'main', 'article', '[role="main"]', '.content', 
          '.post-content', '.entry-content', '.article-content', '.main-content'
        ];
        
        let content = '';
        for (const selector of selectors) {
          const element = page$(selector);
          if (element.length && element.text().trim().length > 200) {
            content = element.text().replace(/\s+/g, ' ').trim().substring(0, 3000);
            break;
          }
        }
        
        // フォールバック: body全体
        if (!content) {
          content = page$('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
        }
        
        const domain = new URL(result.url).hostname;
        
        if (content && html) {
          // articles_rawテーブルに保存
          try {
            await db.insert(articlesRaw).values({
              url: result.url,
              title: result.title,
              html: html.substring(0, 50000) // HTMLサイズ制限
            }).onConflictDoNothing();
            
            console.log(`Saved to database: ${result.title}`);
          } catch (dbError) {
            console.error(`Database save failed for ${result.url}:`, dbError);
          }
          
          scrapedResults.push({
            url: result.url,
            title: result.title,
            content,
            domain
          });
        }
        
        // 3秒遅延（最後のアイテム以外）
        if (i < Math.min(searchResults.length, maxResults) - 1) {
          console.log('Waiting 3 seconds before next request...');
          await delay(3000);
        }
        
      } catch (error) {
        console.error(`Failed to scrape ${result.url}:`, error);
        // エラーがあっても続行
      }
    }
    
    console.log(`Successfully scraped ${scrapedResults.length} pages`);
    return scrapedResults;
    
  } catch (error) {
    console.error('Web scraping failed:', error);
    throw new Error(`Web scraping failed: ${(error as Error).message}`);
  }
}

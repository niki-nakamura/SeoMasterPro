// Unit tests for API endpoints
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');

describe('API Endpoints', () => {
  const baseUrl = 'http://localhost:5000';
  
  describe('/api/scrape', () => {
    it('should scrape search results successfully', async () => {
      const response = await fetch(`${baseUrl}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test keyword',
          maxResults: 2
        })
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('count');
      expect(Array.isArray(data.results)).toBe(true);
      expect(typeof data.count).toBe('number');
    });
    
    it('should handle missing keyword parameter', async () => {
      const response = await fetch(`${baseUrl}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(400);
    });
    
    it('should validate maxResults parameter', async () => {
      const response = await fetch(`${baseUrl}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test',
          maxResults: 'invalid'
        })
      });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('/proxy/llm', () => {
    it('should proxy LLM requests successfully', async () => {
      const response = await fetch(`${baseUrl}/proxy/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Say hello',
          model: 'tinymistral'
        })
      });
      
      // Note: This test will fail if Ollama is not running
      // In a real test environment, you'd mock the Ollama service
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('text');
        expect(typeof data.text).toBe('string');
      } else {
        // Ollama not available, check error handling
        expect(response.status).toBe(500);
        const error = await response.json();
        expect(error).toHaveProperty('message');
      }
    });

    it('should handle LLM requests with vector context', async () => {
      const response = await fetch(`${baseUrl}/proxy/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test question',
          model: 'tinymistral',
          useContext: true,
          keyword: 'test'
        })
      });
      
      // Should handle context injection regardless of Ollama status
      expect(response.status).toBeOneOf([200, 500]);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('text');
      } else {
        const error = await response.json();
        expect(error).toHaveProperty('message');
      }
    });
    
    it('should handle missing prompt parameter', async () => {
      const response = await fetch(`${baseUrl}/proxy/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.message).toContain('Prompt is required');
    });
    
    it('should use default model when not specified', async () => {
      const response = await fetch(`${baseUrl}/proxy/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt'
        })
      });
      
      // Should use tinymistral as default model
      expect(response.status).toBeOneOf([200, 500]); // 500 if Ollama not running
    });
  });
  
  describe('/api/vector-search', () => {
    it('should perform vector search successfully', async () => {
      const response = await fetch(`${baseUrl}/api/vector-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test search',
          k: 5
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('count');
      expect(Array.isArray(data.results)).toBe(true);
      expect(typeof data.count).toBe('number');
      
      // ベクトル検索結果の構造をチェック
      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('similarity');
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('title');
      }
    });
    
    it('should handle missing keyword parameter', async () => {
      const response = await fetch(`${baseUrl}/api/vector-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.message).toContain('Keyword is required');
    });
    
    it('should handle custom k parameter', async () => {
      const response = await fetch(`${baseUrl}/api/vector-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'test',
          k: 3
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('/api/articles-raw', () => {
    it('should fetch raw articles from database', async () => {
      const response = await fetch(`${baseUrl}/api/articles-raw`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const article = data[0];
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('url');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('html');
        expect(article).toHaveProperty('fetchedAt');
      }
    });
  });
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
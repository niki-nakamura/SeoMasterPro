# SEO Content Generator

AI-powered SEO content generation application with local LLM support.

## Features

- 5-step content generation workflow
- Web scraping for competitor analysis
- **pgvector TOP-k search** for intelligent content context
- Local LLM integration with Ollama (with context injection)
- PostgreSQL database with vector embeddings
- Supabase authentication
- Modern React + TypeScript frontend
- Comprehensive test suite with Jest

## Quick Start

### Cloud Deployment (Replit)
1. Fork the project on Replit
2. Lite mode is enabled by default (tinymistral only, ~340MB)
3. Go to Settings page → Click "サーバーを起動" button
4. Automatic model download and chat setup

### Self-Hosted Docker (Full Models)
1. Clone the repository
2. Run full model stack:
```bash
docker-compose up --build
```
This includes all models (requires 8GB+ storage for complete setup)

### Local Development
1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (copy from .env.example):
```bash
# Required
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_key

# Deployment mode
LITE_MODE=true          # Replit mode (tinymistral only)
VITE_LITE_MODE=true     # Frontend mode indicator
```

3. Start the development server:
```bash
npm run dev
```

## Local LLM Setup (Recommended)

To minimize server costs and run LLM processing locally:

### 1. Install Ollama

**macOS:**
```bash
brew install ollama
```

**Windows:**
Download and run OllamaSetup.exe from [ollama.ai](https://ollama.ai)

**Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

### 2. Download and Start Model

```bash
# Download the lightweight model (800MB)
ollama pull tinymistral

# Start the Ollama server
ollama serve
```

### 3. Test Connection

```bash
# Test the API
curl http://localhost:11434/api/generate \
     -d '{"model":"tinymistral","prompt":"Hello","stream":false}'
```

### 4. Configure in App

1. Go to Settings page in the application
2. Verify the Ollama URL is set to `http://localhost:11434`
3. Click "接続テスト" (Connection Test) - should show green checkmark
4. Local LLM is now ready for content generation

## Architecture

### Cost-Optimized Design
- **Local LLM**: Runs on user's PC (0$ server cost)
- **Replit Hosting**: Autoscale (~$1.4/month)
- **Database**: Neon PostgreSQL free tier
- **Total**: ~$1.4/month per deployment

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, Drizzle ORM
- **Database**: PostgreSQL with pgvector
- **LLM**: Ollama (local) + OpenAI (fallback)
- **Auth**: Supabase with GitHub OAuth

## Development

### Database Setup
```bash
# Push schema changes
npm run db:push

# View database
npm run db:studio
```

### API Endpoints

#### Core LLM Context API
- `POST /api/llm-context` - pgvector TOP-k content retrieval
  ```json
  {
    "keyword": "SEO optimization",
    "response": {
      "contextText": "...",
      "sources": [...],
      "count": 7
    }
  }
  ```

#### Vector Search API
- `POST /api/vector-search` - Semantic similarity search
- `POST /proxy/llm` - Enhanced LLM with context injection
- `POST /api/scrape` - Web scraping for competitor analysis

### Testing
```bash
# Run API tests (including pgvector tests)
npm test

# Test specific endpoint
curl -X POST http://localhost:5000/api/llm-context \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test"}'
```

### Deployment

### Supabase Configuration
1. Go to Supabase Dashboard → Auth → URL Configuration
2. Set **Site URL**: `https://seo-master-pro-nikinakamu.replit.app`
3. Add **Additional Redirect URLs**: same URL
4. Save settings

### Replit Secrets
Add the following in Replit UI (Secrets):

**App Secrets** (Development):
- `VITE_SITE_URL`: `http://localhost:3000`

**Deployment Secrets** (Production):
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key  
- `VITE_SITE_URL`: `https://seo-master-pro-nikinakamu.replit.app`

### Deploy
Click **Deploy** in Replit interface

## Workflow Steps

1. **Scrape Competitors**: Analyze competitor content via DuckDuckGo search
2. **Generate Persona & Intent**: AI analysis of target audience and search intent  
3. **Create Outline**: Generate structured content outline
4. **Write Content**: Generate H2 sections using local LLM with competitor context
5. **Finalize**: Create meta tags and prepare for publication

## Local LLM Benefits

- **Zero Server Cost**: LLM runs on user's hardware
- **Privacy**: Content never leaves user's machine
- **Performance**: No API rate limits or latency
- **Context**: Can process all 7 scraped articles as context (up to 4096 tokens)

## Troubleshooting

### Ollama Connection Issues
1. Ensure Ollama is running: `ollama serve`
2. Check if model is downloaded: `ollama list`
3. Test API manually: `curl http://localhost:11434/api/generate -d '{"model":"tinymistral","prompt":"test"}'`

### Build Issues
- Clear node_modules and reinstall if TypeScript errors persist
- Ensure all environment variables are set correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## License

MIT License
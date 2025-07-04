# SEO Content Generator

AI-powered SEO content generation application with local LLM support.

## Features

- 5-step content generation workflow
- Web scraping for competitor analysis
- **pgvector TOP-k search** for intelligent content context
- **Dual-mode LLM system**: WebGPU browser inference + Ollama server fallback
- **WebLLM Llama 3 8B**: Client-side GPU acceleration for supported browsers
- **Auto-detection**: Optimal inference mode selection based on browser capabilities
- PostgreSQL database with vector embeddings
- Supabase authentication
- Modern React + TypeScript frontend
- Comprehensive test suite with Jest

## Quick Start

### 🚀 Cloud Deployment (Replit) - Recommended
**Zero-cost local LLM deployment with automatic setup**

1. **Fork or Import to Replit**
   - Visit the project on Replit
   - Click "Fork" or "Import to Replit"

2. **Deploy to Autoscale**
   - Click "Run" → "Deploy" → "Autoscale"
   - Select: 1 CPU / 1 GB RAM (sufficient for lite mode)
   - Deploy will take 2-3 minutes

3. **One-Click Setup**
   - Navigate to `/settings` page
   - Click "サーバーを起動" button
   - Wait 1-2 minutes for tinymistral download (340MB)
   - Green badge indicates ready status

4. **Start Chatting**
   - Navigate to `/chat` page
   - Send "Hello" message
   - Get response from local LLM

**Cost: ~$1.4/month (database only)**

### 🐳 Self-Hosted Docker (Full Models)
**Complete model stack for maximum quality**

1. **Clone and Run**
   ```bash
   git clone <repo-url>
   cd seo-master-pro
   docker-compose up --build
   ```

2. **Access Application**
   - Open http://localhost:5000
   - All models download automatically (~3.5GB)
   - Full feature set available

**Requirements: 8GB+ storage, 4GB+ RAM**

### 💻 Local Development
**Development environment setup**

1. **Prerequisites**
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Install dependencies
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Configure DATABASE_URL and other variables
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

**Note: Use local PostgreSQL or Neon database**

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

## WebLLM Dual-Mode System

### WebGPU Browser Inference (Llama 3 8B)
**Automatic initialization on supported browsers**

#### Prerequisites
- Chrome 119+ or Edge 119+ (Windows/Mac/Linux)
- 4GB+ VRAM available 
- WebGPU enabled in browser settings

#### Setup & Testing
1. **Navigate to Settings**: `/settings` page
2. **Auto-Detection**: WebGPU support badge shows status
3. **One-Click Init**: Click "サーバーを起動" button
4. **Progress Tracking**: `Fetching params 0 / 1900 MB` with real-time progress bar
5. **Completion**: Auto-redirect to `/chat` page when ready

#### Performance
- **Model Size**: ~1.9GB (Llama 3 8B q4f16_1)
- **Download Speed**: 50-200 Mbps (depending on CDN)
- **Inference Speed**: 9-11 tokens/second
- **Cache**: IndexedDB persistence - 2nd load <3s

#### CDN Configuration
For production deployment, configure CORS on your CDN:

```json
[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"]
}]
```

Set `MODEL_URL=https://cdn.example.com/llama3-8b-q4f16_1/` in environment variables.

**Custom Model URL Setup:**
If you want to use a different CDN or host your own model files:

1. Upload the `llama3-8b-q4f16_1-MLC/` directory to your CDN/storage
2. Set the `MODEL_URL` environment variable to your CDN URL
3. Ensure CORS is configured to allow GET/HEAD requests from your domain
4. For Replit: Add `MODEL_URL=https://your-cdn.com/llama3-8b-q4f16_1/` to Secrets

### Ollama Server Fallback (tinymistral)
**Automatic fallback for non-WebGPU browsers**

#### Auto-Fallback Conditions
- Firefox ESR or browsers without WebGPU
- WebGPU initialization failure
- Insufficient VRAM (<4GB)

#### Performance
- **Model Size**: 340MB (tinymistral)
- **Inference Speed**: 6 tokens/second
- **Setup Time**: ~30 seconds

#### Testing Checklist
- ✅ Chrome/Edge → WebGPU mode → 9-11 tok/s
- ✅ Firefox → Ollama fallback → 6 tok/s  
- ✅ 2nd access → IndexedDB cache → <3s load
- ✅ Settings page → Real-time progress bars
- ✅ Chat interface → Mode indicator badges

## Local LLM Benefits

- **Zero External API Cost**: Complete local inference system
- **Privacy**: Content never leaves user's machine
- **Performance**: No API rate limits or latency  
- **Context**: Can process all 7 scraped articles as context (up to 4096 tokens)
- **Auto-Selection**: Optimal mode based on browser capabilities

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
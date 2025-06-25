# SEO Content Generator

AI-powered SEO content generation application with local LLM support.

## Features

- 5-step content generation workflow
- Web scraping for competitor analysis
- Local LLM integration with Ollama
- PostgreSQL database with vector search
- Supabase authentication
- Modern React + TypeScript frontend

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Required
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_key

# For Supabase authentication (production)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For OAuth redirect (development/production)
VITE_SITE_URL=http://localhost:3000  # Development
# VITE_SITE_URL=https://your-app.replit.app  # Production
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

### Testing
```bash
# Run API tests
npm test

# Record new tests with Pythagora
npx pythagora
```

### Deployment

### Supabase Configuration
1. Go to Supabase Dashboard → Auth → URL Configuration
2. Set **Site URL**: `https://your-app.replit.app`
3. Add **Additional Redirect URLs**: same URL
4. Save settings

### Replit Secrets
Add the following in Replit UI (Secrets):

**App Secrets** (Development):
- `VITE_SITE_URL`: `http://localhost:3000`

**Deployment Secrets** (Production):
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key  
- `VITE_SITE_URL`: `https://your-app.replit.app`

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
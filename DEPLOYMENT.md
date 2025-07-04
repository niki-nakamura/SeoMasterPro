# Deployment Guide

## Overview

SeoMasterPro supports three deployment modes:
- **Replit Cloud** (Recommended): Lite mode with automatic setup
- **Docker Self-Host**: Full model stack with complete features
- **Local Development**: Development environment

## 🚀 Replit Deployment (Recommended)

### Benefits
- Zero external API costs (~$1.4/month for database only)
- Automatic model setup (tinymistral, 340MB)
- One-click deployment
- 1-2 minute setup time

### Steps
1. **Fork Project**
   - Visit project on Replit
   - Click "Fork" or "Import to Replit"

2. **Deploy to Autoscale**
   - Click "Run" → "Deploy" → "Autoscale"
   - Select: 1 CPU / 1 GB RAM
   - Wait 2-3 minutes for deployment

3. **One-Click Setup**
   - Navigate to `/settings`
   - Click "サーバーを起動" button
   - Wait for green status badge

4. **Verify Deployment**
   - Navigate to `/chat`
   - Send "Hello" message
   - Receive LLM response

### Verification Commands
```bash
# Check deployment status
npm run verify

# Run E2E tests
bash scripts/e2e.sh
```

## 🐳 Docker Deployment

### Benefits
- Complete model stack (tinymistral + mxbai-embed-large + llama3.2:3b)
- Full feature set
- Self-hosted control

### Requirements
- 8GB+ storage
- 4GB+ RAM
- Docker & Docker Compose

### Steps
```bash
# Clone repository
git clone <repo-url>
cd seo-master-pro

# Start services
docker-compose up --build

# Access application
open http://localhost:5000
```

### Health Check
```bash
# Check service health
curl http://localhost:5000/api/health

# Check Ollama status
curl http://localhost:5000/api/ollama/status
```

## 💻 Local Development

### Prerequisites
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install Node.js dependencies
npm install
```

### Setup
```bash
# Environment configuration
cp .env.example .env

# Configure variables
DATABASE_URL=<your-database-url>
OPENAI_API_KEY=<optional>
LITE_MODE=false
```

### Development Server
```bash
# Start development server
npm run dev

# Start Ollama (separate terminal)
ollama serve

# Pull required models
ollama pull tinymistral
ollama pull mxbai-embed-large
ollama pull llama3.2:3b
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LITE_MODE` | Enable lite mode (Replit) | `true` |
| `OLLAMA_HOST` | Ollama server URL | `http://127.0.0.1:11434` |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `SCRAPE_DELAY_MS` | Scraping delay | `3000` |

## Testing

### Verification Script
```bash
# Basic deployment verification
node scripts/verify-deployment.js

# Lite mode verification
LITE_MODE=true node scripts/verify-deployment.js
```

### E2E Testing
```bash
# Run complete E2E test suite
bash scripts/e2e.sh
```

### API Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Ollama status
curl http://localhost:5000/api/ollama/status

# Articles API
curl http://localhost:5000/api/articles
```

## Troubleshooting

### Replit Deployment Issues
- **Models not downloading**: Check /settings page, click "サーバーを起動"
- **Chat not responding**: Verify green status badge in settings
- **Deployment timeout**: Increase RAM to 1GB in autoscale settings

### Docker Issues
- **Port conflicts**: Change port in docker-compose.yml
- **Storage issues**: Ensure 8GB+ available space
- **Memory issues**: Allocate 4GB+ RAM to Docker

### Local Development Issues
- **Ollama not found**: Install Ollama using official installer
- **Database connection**: Verify DATABASE_URL in .env
- **Model not found**: Pull models using `ollama pull <model-name>`

## Performance Metrics

### Replit Lite Mode
- **Setup time**: 1-2 minutes
- **Model size**: 340MB (tinymistral only)
- **Response time**: 1-3 seconds
- **Cost**: ~$1.4/month

### Docker Full Mode
- **Setup time**: 5-10 minutes
- **Model size**: 3.5GB (all models)
- **Response time**: 0.5-2 seconds
- **Cost**: Self-hosted only

### Local Development
- **Setup time**: 10-15 minutes
- **Model size**: Variable
- **Response time**: 0.5-1 second
- **Cost**: Hardware only

## Security

### Replit
- Environment variables automatically secured
- HTTPS enabled by default
- No API key exposure

### Docker
- No external API dependencies
- Local network isolation
- Volume-based persistence

### Local
- Local-only operation
- No external data transmission
- Full control over data

## Monitoring

### Health Endpoints
- `/api/health` - Application health
- `/api/ollama/status` - LLM server status

### Logs
- Application logs: stdout/stderr
- Ollama logs: Check service status
- Database logs: PostgreSQL logs

## Support

For deployment issues:
1. Check deployment logs
2. Run verification scripts
3. Review environment variables
4. Consult troubleshooting section
# Content Generator Application

## Overview

This is a full-stack web application designed for automated content generation using AI-powered competitor analysis. The application follows a step-by-step workflow to create high-quality, SEO-optimized articles by analyzing competitor content and generating structured content based on target keywords and industry context.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js REST API
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **AI Integration**: OpenAI GPT-4o for content generation
- **Web Scraping**: Playwright for competitor analysis

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database
- **Schema Management**: Drizzle ORM with migrations
- **Tables**: 
  - `articles` - Main content workflow state
  - `scraped_urls` - Competitor content cache
  - `content_vectors` - Future semantic search capability

## Key Components

### Content Generation Workflow
The application implements a 5-step content generation process:

1. **Scrape Step**: Competitor analysis via web scraping
2. **Persona & Intent Step**: Target audience and search intent analysis
3. **Outline Step**: Content structure generation
4. **Generate Step**: AI-powered content creation
5. **Finalize Step**: Meta tag generation and publication preparation

### API Architecture
- RESTful API design with Express.js
- Centralized error handling and logging
- File-based route organization
- JSON request/response format with validation

### UI Components
- **Layout Components**: Header, sidebar navigation
- **Workflow Components**: Step-by-step content generation interface
- **Data Components**: Article management and tables
- **Form Components**: Reactive forms with validation

## Data Flow

1. **Content Creation**: User initiates workflow with target keyword and context
2. **Competitor Analysis**: System scrapes Google search results for competitor content
3. **AI Analysis**: OpenAI analyzes scraped content to understand audience and intent
4. **Structure Generation**: AI creates detailed content outline
5. **Content Generation**: AI writes content section by section
6. **Meta Optimization**: AI generates SEO meta tags and descriptions
7. **Publication**: Final content ready for publishing

## External Dependencies

### Third-Party Services
- **OpenAI API**: GPT-4o model for content generation and analysis
- **Neon Database**: Serverless PostgreSQL hosting
- **Playwright**: Browser automation for web scraping

### Development Dependencies
- **Replit Environment**: Cloud development and deployment platform
- **TypeScript**: Type safety and development experience
- **ESBuild**: Production bundling for server code

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Development Server**: Vite dev server with HMR
- **Process Management**: Single process running both frontend and backend

### Production Deployment
- **Build Process**: 
  - Frontend: Vite build to `dist/public`
  - Backend: ESBuild bundle to `dist/index.js`
- **Deployment Target**: Replit Autoscale
- **Port Configuration**: Internal port 5000, external port 80
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY

### Database Management
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling via Neon serverless driver
- **Schema**: Shared schema definitions between frontend and backend

## Changelog
- June 24, 2025: Initial setup completed
  ✓ Database schema pushed successfully
  ✓ OpenAI API key configured
  ✓ All 5 workflow steps implemented
  ✓ Full-stack application ready for testing
- June 25, 2025: Vector search capability added
  ✓ pgvector extension enabled
  ✓ contentVectors table updated with 768-dimension embeddings
  ✓ Database migration completed successfully
- June 25, 2025: Advanced scraping system implemented
  ✓ /api/scrape endpoint with Cheerio-based HTTP scraping
  ✓ articles_raw table for storing complete HTML content
  ✓ DuckDuckGo search integration with 3-second delays
  ✓ Random User-Agent rotation for reliable scraping
  ✓ Error handling and duplicate URL prevention
- June 25, 2025: Complete feature implementation
  ✓ Ollama LLM proxy at /proxy/llm endpoint
  ✓ Zustand state management for 5-step workflow
  ✓ Supabase SSR authentication with GitHub OAuth
  ✓ ProtectedRoute component for secure access
  ✓ My Articles page for user-specific content
  ✓ Jest testing infrastructure with API tests
  ✓ Ready for production deployment
- June 25, 2025: Production deployment preparation
  ✓ Fixed JSX syntax errors in content generator
  ✓ Made Supabase configuration optional for development
  ✓ /api/scrape endpoint working with DuckDuckGo integration
  ✓ Database connection stable with articles saved
  ✓ Application running successfully on port 5000
  ✓ Ready for Supabase secrets configuration and deployment
- June 25, 2025: Ollama Local LLM integration
  ✓ Created client/src/lib/llm.ts for browser-direct Ollama communication
  ✓ Added Settings page with LLM connection testing
  ✓ Zustand store enhanced with local LLM generation methods
  ✓ Context injection for scraped content (up to 7 articles)
  ✓ README with complete Ollama setup instructions
  ✓ Cost-optimized architecture: ~$1.4/month total hosting cost
- June 25, 2025: GitHub OAuth and production deployment fixes
  ✓ Fixed Supabase OAuth redirect with environment-specific URLs
  ✓ Added /auth/callback route for proper OAuth flow
  ✓ Environment variable VITE_SITE_URL for dev/production switching
  ✓ Settings page route added to App.tsx
  ✓ ProtectedRoute OAuth method unified with environment variables
  ✓ Zustand store enhanced with dynamic local LLM import
  ✓ README updated with complete deployment instructions
  ✓ Production build verified and ready for deployment
- June 30, 2025: Final deployment preparation
  ✓ Vector search service for content similarity (keyword-based fallback)
  ✓ Enhanced LLM proxy with TOP-k content injection (8K token limit)
  ✓ Zustand store fallback mechanism (local → server LLM)
  ✓ Updated test cases for new API endpoints
  ✓ Settings and AuthCallback routes properly integrated
  ✓ OAuth redirect URLs unified to VITE_SITE_URL environment variable
  ✓ /auth/callback page implemented with exchangeCodeForSession
  ✓ SPA catch-all route added for production routing
  ✓ Production build verified - ready for final deployment
  ✓ Git committed and pushed - ready for Replit deployment
  ✓ Application ready for Supabase configuration and OAuth testing
- June 30, 2025: Production OAuth authentication successful
  ✓ Supabase GitHub OAuth configuration completed
  ✓ Production URL: https://seo-master-pro-nikinakamu.replit.app
  ✓ OAuth redirect flow tested and working (callback → dashboard)
  ✓ User authentication confirmed with real GitHub account
  ✓ Application fully deployed and operational
- June 30, 2025: Vector search and enhanced LLM integration
  ✓ pgvector TOP-k search function getTopKContent() implemented
  ✓ /api/vector-search endpoint with keyword similarity search
  ✓ Enhanced /proxy/llm with automatic context injection
  ✓ Zustand store updated with vector search integration
  ✓ Local LLM library supports TOP-k content retrieval
  ✓ Jest test cases added for vector search and enhanced LLM
  ✓ .env.example created with OLLAMA_BASE_URL=http://localhost:11434
  ✓ Ready for production build and deployment

## User Preferences

Preferred communication style: Simple, everyday language.
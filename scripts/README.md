# Embedding Scripts

This directory contains scripts for generating and managing vector embeddings for article content.

## Scripts

### `embed_existing_articles.ts`
Generates embeddings for the latest 3 articles from the `articles_raw` table using Ollama's mxbai-embed-large model.

**Features:**
- Fetches latest 3 articles from `articles_raw` table
- Extracts clean text content from HTML
- Generates 1536-dimensional embeddings using local Ollama
- Stores embeddings in `content_vectors` table
- Includes error handling for API connectivity

**Usage:**
```bash
tsx scripts/embed_existing_articles.ts
```

**Requirements:**
- Ollama running on localhost:11434
- mxbai-embed-large model downloaded (`ollama pull mxbai-embed-large`)
- Database connection to Neon PostgreSQL

### `test_embed_setup.ts`
Tests the embedding infrastructure without making API calls.

**Usage:**
```bash
tsx scripts/test_embed_setup.ts
```

## Database Schema

The `content_vectors` table structure:
```sql
CREATE TABLE content_vectors (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Adding to package.json

To add the embed script to your package.json scripts (if permissions allow):
```json
{
  "scripts": {
    "embed": "tsx scripts/embed_existing_articles.ts"
  }
}
```

## Troubleshooting

### Ollama Connection Issues
If you see connection errors to localhost:11434:
1. Ensure Ollama is running: `ollama serve`
2. Check if mxbai-embed-large model is available: `ollama list`
3. Download the model if needed: `ollama pull mxbai-embed-large`
4. Verify API endpoint: `curl http://localhost:11434/api/tags`

### Database Connection Issues
Ensure you have:
- Valid `DATABASE_URL` environment variable
- Neon database with pgvector extension enabled
- Proper WebSocket configuration (included in scripts)

## Next Steps

After running the embed script successfully:
1. Verify embeddings in database: `SELECT COUNT(*) FROM content_vectors;`
2. Test similarity searches using cosine distance
3. Integrate with your semantic search functionality
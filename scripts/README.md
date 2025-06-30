# Embedding Scripts

This directory contains scripts for generating and managing vector embeddings for article content.

## Scripts

### `embed_existing_articles.ts`
Generates embeddings for the latest 3 articles from the `articles_raw` table using OpenAI's text-embedding-3-small model.

**Features:**
- Fetches latest 3 articles from `articles_raw` table
- Extracts clean text content from HTML
- Generates 1536-dimensional embeddings using OpenAI
- Stores embeddings in `content_vectors` table
- Includes rate limiting protection

**Usage:**
```bash
tsx scripts/embed_existing_articles.ts
```

**Requirements:**
- Valid `OPENAI_API_KEY` environment variable
- Sufficient OpenAI API quota
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

### OpenAI API Quota Exceeded
If you see a 429 error with "insufficient_quota":
1. Check your OpenAI account billing and usage
2. Upgrade your OpenAI plan if needed
3. Wait for quota reset if on free tier

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
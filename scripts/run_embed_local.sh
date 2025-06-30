#!/bin/bash

echo "🚀 Running local Ollama embedding script..."
echo "📋 Prerequisites check:"

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running on localhost:11434"
else
    echo "❌ Ollama is not accessible. Please ensure:"
    echo "   1. Ollama is running: ollama serve"
    echo "   2. Port 11434 is accessible"
    exit 1
fi

# Check if mxbai-embed-large model is available
if curl -s http://localhost:11434/api/tags | grep -q "mxbai-embed-large"; then
    echo "✅ mxbai-embed-large model is available"
else
    echo "⚠️  mxbai-embed-large model not found. Download with:"
    echo "   ollama pull mxbai-embed-large"
    echo "Continuing anyway..."
fi

echo ""
echo "🔥 Starting embedding process..."
tsx scripts/embed_existing_articles.ts
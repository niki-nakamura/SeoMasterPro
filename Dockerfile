FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --prod

# Copy application code
COPY . .

# Build the application
RUN pnpm run build

# Create directory for Ollama models
RUN mkdir -p /root/.ollama

# Expose ports
EXPOSE 5000 11434

# Set environment variables
ENV NODE_ENV=production
ENV OLLAMA_HOST=http://127.0.0.1:11434
ENV LITE_MODE=false
ENV RECOMMENDED_MODELS=tinymistral,mxbai-embed-large,llama3.2:3b

# Start both Ollama server and application
CMD ["bash", "-c", "ollama serve & sleep 5 && node dist/index.js"]
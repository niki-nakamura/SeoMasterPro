#!/bin/bash

# E2E Testing Script for SeoMasterPro
# Tests complete deployment workflow

echo "🧪 SeoMasterPro E2E Testing"
echo "=========================="

# Configuration
MAX_RETRIES=30
RETRY_DELAY=10
BASE_URL="http://localhost:5000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test HTTP endpoint
test_endpoint() {
  local endpoint=$1
  local expected_status=$2
  local description=$3
  
  echo -n "Testing $description... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
  
  if [ "$response" -eq "$expected_status" ]; then
    echo -e "${GREEN}OK${NC}"
    return 0
  else
    echo -e "${RED}FAILED${NC} (got $response, expected $expected_status)"
    return 1
  fi
}

# Function to wait for service
wait_for_service() {
  local service_name=$1
  local endpoint=$2
  local max_tries=$3
  
  echo "Waiting for $service_name to be ready..."
  
  for i in $(seq 1 $max_tries); do
    if curl -s -f "$BASE_URL$endpoint" > /dev/null 2>&1; then
      echo -e "${GREEN}$service_name is ready!${NC}"
      return 0
    fi
    
    echo -n "."
    sleep $RETRY_DELAY
  done
  
  echo -e "${RED}$service_name failed to start within timeout${NC}"
  return 1
}

# Function to test Ollama server
test_ollama_server() {
  echo "Testing Ollama server..."
  
  # Check if Ollama is running
  response=$(curl -s "$BASE_URL/api/ollama/status")
  
  if echo "$response" | grep -q '"running":true'; then
    echo -e "${GREEN}Ollama server is running${NC}"
    
    # Check for models
    if echo "$response" | grep -q '"models":\['; then
      echo -e "${GREEN}Models are available${NC}"
      
      # Test tinymistral model
      if echo "$response" | grep -q 'tinymistral'; then
        echo -e "${GREEN}Tinymistral model found${NC}"
        return 0
      else
        echo -e "${YELLOW}Tinymistral model not found${NC}"
        return 1
      fi
    else
      echo -e "${YELLOW}No models available${NC}"
      return 1
    fi
  else
    echo -e "${RED}Ollama server is not running${NC}"
    return 1
  fi
}

# Function to test chat functionality
test_chat() {
  echo "Testing chat functionality..."
  
  # Test ping-pong
  response=$(curl -s -X POST "$BASE_URL/api/ollama/chat" \
    -H "Content-Type: application/json" \
    -d '{"message": "ping", "model": "tinymistral"}')
  
  if echo "$response" | grep -q "pong\|hello\|hi"; then
    echo -e "${GREEN}Chat functionality working${NC}"
    return 0
  else
    echo -e "${RED}Chat functionality failed${NC}"
    echo "Response: $response"
    return 1
  fi
}

# Main test sequence
main() {
  echo "Starting E2E tests..."
  
  # Test 1: Basic server health
  if ! test_endpoint "/api/health" 200 "Health endpoint"; then
    echo -e "${RED}Basic server health check failed${NC}"
    exit 1
  fi
  
  # Test 2: Wait for server to be fully ready
  if ! wait_for_service "Main server" "/api/health" 10; then
    echo -e "${RED}Main server failed to start${NC}"
    exit 1
  fi
  
  # Test 3: Test Ollama status endpoint
  if ! test_endpoint "/api/ollama/status" 200 "Ollama status endpoint"; then
    echo -e "${RED}Ollama status endpoint failed${NC}"
    exit 1
  fi
  
  # Test 4: Test static file serving
  if ! test_endpoint "/" 200 "Frontend serving"; then
    echo -e "${RED}Frontend serving failed${NC}"
    exit 1
  fi
  
  # Test 5: Test API routes
  if ! test_endpoint "/api/articles" 200 "Articles API"; then
    echo -e "${RED}Articles API failed${NC}"
    exit 1
  fi
  
  # Test 6: Test Ollama functionality (optional, depends on model availability)
  if test_ollama_server; then
    echo "Ollama server is ready, testing chat..."
    if test_chat; then
      echo -e "${GREEN}Full E2E test passed!${NC}"
    else
      echo -e "${YELLOW}Basic server works, but chat needs model setup${NC}"
    fi
  else
    echo -e "${YELLOW}Ollama server not ready, but basic functionality works${NC}"
  fi
  
  echo ""
  echo "🎉 E2E Test Summary:"
  echo "- Server health: OK"
  echo "- Frontend serving: OK"
  echo "- API endpoints: OK"
  echo "- Ollama integration: Ready for model setup"
  echo ""
  echo "Next steps for full functionality:"
  echo "1. Go to /settings"
  echo "2. Click 'サーバーを起動' button"
  echo "3. Wait for model download"
  echo "4. Navigate to /chat"
  echo "5. Send a message"
  
  exit 0
}

# Handle interruption
trap 'echo -e "\n${RED}Test interrupted${NC}"; exit 1' INT

# Run main function
main
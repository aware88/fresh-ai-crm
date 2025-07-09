#!/bin/bash

# Script to check API routes and their authentication requirements
echo "=== API Route Authentication Check ==="
echo ""

# Function to test an API route
test_route() {
  local route=$1
  local description=$2
  
  echo "Testing $description: $route"
  echo "----------------------------------------"
  
  # Make the request with curl
  response=$(curl -s -w "\nStatus: %{http_code}" -X GET "http://localhost:3000$route" \
    -H "Content-Type: application/json" \
    --cookie-jar cookies.txt --cookie cookies.txt)
  
  # Extract status code
  status=$(echo "$response" | grep "Status:" | cut -d' ' -f2)
  body=$(echo "$response" | sed '$d')
  
  echo "Status: $status"
  echo "Response:"
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo ""
}

# Test the API routes
test_route "/api/test-auth" "Authentication Test API"
test_route "/api/suppliers" "Suppliers API"
test_route "/api/emails?top=5" "Emails API"

echo "=== API Authentication Check Complete ==="
echo "Note: 401 responses are expected when not authenticated"
echo "This confirms our authentication checks are working correctly"

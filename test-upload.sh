#!/bin/bash

# Create a test image
echo "Creating test image..."
echo "fake image data for testing" > test-image.png

# Test upload without auth first to see the error
echo "Testing upload to /api/uploads..."
curl -v -X POST http://localhost:8080/api/uploads \
  -F "file=@test-image.png" 2>&1 | grep -A5 "< HTTP"

echo -e "\nTesting upload to /uploads..."
curl -v -X POST http://localhost:8080/uploads \
  -F "file=@test-image.png" 2>&1 | grep -A5 "< HTTP"

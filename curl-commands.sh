#!/bin/bash

# Base URL
BASE_URL="https://lightmetrics-chatbot.netlify.app"

# Authorization token
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZmNjU3ZGRiYWJmYmZkOTVhNGVkNjZjMjMyNDExZWFhNjE5OGQ4NGMxYmJkOGEyYTI5M2I4MTVmYjRhOTlhYjEifQ.eyJpZCI6Im1lbV9zYl9jbWV3aHJvcTcwMDE0MHd2YWhrcW00d2J6IiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc2MjkzODAwNiwiZXhwIjoxNzk0MDQyMDA2LCJhdWQiOiJhcHBfY2x6Mmt4dHB5MDA3ejB0cnA2aGNoM3g0eCIsImlzcyI6Imh0dHBzOi8vYXBpLm1lbWJlcnN0YWNrLmNvbSJ9.J1O4dBGRZyoJfCO1vxAqVTKlRWbUjtVQwcmzlpoOALifXDycfvZzsZlcyizJ8WHXNLA0GGyUvgv1hHXRxNGjZnE-g-4hr7yg1LLgMMPoXbJhzA9klwXQGNPB8aOwVoUXYUH_QPPLRMGTRnCWr9LUX7n5qFJsxkp-62_62eXA6QtwaoNVHOEU3MnD1D-NEqFEiSGknOt4AKWFrzTEg-wrbOtk4_DOut9Q9KAIjZ9gTN81SOJr8RaSgu29yQNdVBQnFWLbkKKpPTMhYcDqUjtUK5xgZpQ5ELqI9dCduqztWB9o7_w94lBeljvp8HyKWBYhUqR_gd6dHR4ntjD8gDUiaA"

echo "=== 1. Get Answer (POST) ==="
curl -X POST "${BASE_URL}/api/get-answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"question": "What is your question?"}'

echo -e "\n\n=== 2. Save Feedback (POST) ==="
curl -X POST "${BASE_URL}/api/save-feedback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"query": "What is your question?", "answer": "The answer to your question"}'

echo -e "\n\n=== 3. Category Questions (GET) ==="
curl -X GET "${BASE_URL}/api/category-questions?category=your-category-name" \
  -H "Authorization: Bearer ${TOKEN}"

echo -e "\n\n=== 4. All Categories (GET) ==="
curl -X GET "${BASE_URL}/api/all-categories" \
  -H "Authorization: Bearer ${TOKEN}"

echo -e "\n\n=== 5. Health Check (GET) ==="
curl -X GET "${BASE_URL}/api/health" \
  -H "Authorization: Bearer ${TOKEN}"


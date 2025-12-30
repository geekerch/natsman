#!/bin/bash

# Test script for NATS Pub/Sub functionality
# Prerequisites: NATS server running on localhost:4222

BASE_URL="http://localhost:8080/api"

echo "=== NATS Pub/Sub Test Script ==="
echo ""

# 1. Start a subscription
echo "1. Starting subscription on 'test.events'..."
curl -s -X POST $BASE_URL/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "test.events",
    "config": {
      "url": "nats://localhost:4222"
    }
  }' | jq .

echo ""
sleep 1

# 2. Check active subscriptions
echo "2. Checking active subscriptions..."
curl -s $BASE_URL/subscriptions | jq .

echo ""
sleep 1

# 3. Publish a message
echo "3. Publishing a message to 'test.events'..."
curl -s -X POST $BASE_URL/send \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "pubsub",
    "subject": "test.events",
    "body": "{\"event\": \"test\", \"message\": \"Hello from curl!\", \"timestamp\": \"'$(date -Iseconds)'\"}",
    "variables": {}
  }' | jq .

echo ""
sleep 1

# 4. Publish another message
echo "4. Publishing another message..."
curl -s -X POST $BASE_URL/send \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "pubsub",
    "subject": "test.events",
    "body": "{\"event\": \"test2\", \"message\": \"Second message\"}",
    "variables": {}
  }' | jq .

echo ""
sleep 1

# 5. Get messages from subscription
echo "5. Getting messages from subscription..."
curl -s "$BASE_URL/subscriptions/test.events/messages" | jq .

echo ""
sleep 1

# 6. Clear messages
echo "6. Clearing messages..."
curl -s -X DELETE "$BASE_URL/subscriptions/test.events/messages" | jq .

echo ""
sleep 1

# 7. Check messages again (should be empty)
echo "7. Checking messages again (should be empty)..."
curl -s "$BASE_URL/subscriptions/test.events/messages" | jq .

echo ""
sleep 1

# 8. Unsubscribe
echo "8. Unsubscribing from 'test.events'..."
curl -s -X POST $BASE_URL/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "test.events"
  }' | jq .

echo ""
sleep 1

# 9. Check active subscriptions (should be empty)
echo "9. Checking active subscriptions (should be empty)..."
curl -s $BASE_URL/subscriptions | jq .

echo ""
echo "=== Test Complete ==="

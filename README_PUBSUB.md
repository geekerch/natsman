# NATS Pub/Sub Support

This project now supports both **Request/Reply** and **Pub/Sub** patterns in NATS.

## Features

### 1. Request/Reply Mode (Original)
- Sends a request and waits for a reply
- Includes timeout handling
- Returns the reply data and elapsed time

### 2. Pub/Sub Mode (New)
- **Publish**: Send messages to a subject without expecting a reply
- **Subscribe**: Listen to messages on a subject in real-time
- **Manage Subscriptions**: View active subscriptions and received messages

## Template Format

Templates now include a `Mode` field to specify the communication pattern:

```
Mode: request|pubsub
Subject: your.subject.here
---
{
  "your": "payload",
  "with": "{{.variables}}"
}
```

### Example Request/Reply Template
```
Mode: request
Subject: user.get
---
{
  "userId": "{{.userId}}"
}
```

### Example Pub/Sub Template
```
Mode: pubsub
Subject: events.user.created
---
{
  "event": "user.created",
  "data": {
    "userId": "{{.userId}}",
    "username": "{{.username}}"
  }
}
```

## API Endpoints

### Request/Reply & Publish
```
POST /api/send
{
  "mode": "request|pubsub",
  "subject": "your.subject",
  "body": "payload",
  "variables": {...},
  "config": {
    "url": "nats://localhost:4222",
    "creds_path": ""
  }
}
```

### Subscribe
```
POST /api/subscribe
{
  "subject": "your.subject",
  "config": {
    "url": "nats://localhost:4222",
    "creds_path": ""
  }
}
```

### Get Active Subscriptions
```
GET /api/subscriptions
Response: {
  "subscriptions": ["subject1", "subject2"]
}
```

### Get Messages from Subscription
```
GET /api/subscriptions/:subject/messages
Response: {
  "messages": [
    {
      "subject": "your.subject",
      "data": "message content",
      "timestamp": "2024-12-30T10:20:00Z"
    }
  ]
}
```

### Clear Messages
```
DELETE /api/subscriptions/:subject/messages
```

### Unsubscribe
```
POST /api/unsubscribe
{
  "subject": "your.subject"
}
```

## RPC Methods (Wails Desktop App)

For desktop mode using Wails, the following methods are available:

- `SendRequest(payload)` - Send request or publish message
- `Subscribe(payload)` - Start listening to a subject
- `Unsubscribe(subject)` - Stop listening to a subject
- `GetSubscriptionMessages(subject)` - Get received messages
- `GetActiveSubscriptions()` - List all active subscriptions
- `ClearSubscriptionMessages(subject)` - Clear message history

## Usage Examples

### Publishing Messages
```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "pubsub",
    "subject": "events.test",
    "body": "{\"message\": \"Hello World\"}",
    "variables": {}
  }'
```

### Starting a Subscription
```bash
curl -X POST http://localhost:8080/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "events.test"
  }'
```

### Getting Messages
```bash
curl http://localhost:8080/api/subscriptions/events.test/messages
```

### Unsubscribing
```bash
curl -X POST http://localhost:8080/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "events.test"
  }'
```

## Notes

- Subscriptions remain active until explicitly unsubscribed or the application closes
- Messages are stored in memory per subscription (up to 100 buffered messages)
- Each subscription maintains its own NATS connection
- Subscriptions work with variables and templates just like requests
- Default mode is "request" if not specified for backward compatibility

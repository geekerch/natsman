#!/usr/bin/env python3
"""
Simple Python example for testing NATS Pub/Sub with natsman
"""

import requests
import json
import time

BASE_URL = "http://localhost:8080/api"

def subscribe(subject):
    """Start a subscription"""
    print(f"📡 Subscribing to: {subject}")
    response = requests.post(
        f"{BASE_URL}/subscribe",
        json={
            "subject": subject,
            "config": {
                "url": "nats://localhost:4222"
            }
        }
    )
    print(f"   Response: {response.json()}\n")
    return response.json()

def publish(subject, message):
    """Publish a message"""
    print(f"📤 Publishing to: {subject}")
    print(f"   Message: {message}")
    response = requests.post(
        f"{BASE_URL}/send",
        json={
            "mode": "pubsub",
            "subject": subject,
            "body": json.dumps(message),
            "variables": {}
        }
    )
    print(f"   Response: {response.json()}\n")
    return response.json()

def get_messages(subject):
    """Get messages from subscription"""
    print(f"📥 Getting messages from: {subject}")
    response = requests.get(f"{BASE_URL}/subscriptions/{subject}/messages")
    data = response.json()
    messages = data.get("messages", [])
    print(f"   Received {len(messages)} messages:")
    for i, msg in enumerate(messages, 1):
        print(f"   [{i}] {msg['timestamp']}: {msg['data']}")
    print()
    return messages

def get_subscriptions():
    """Get all active subscriptions"""
    print("📋 Active subscriptions:")
    response = requests.get(f"{BASE_URL}/subscriptions")
    data = response.json()
    subs = data.get("subscriptions", [])
    if subs:
        for sub in subs:
            print(f"   - {sub}")
    else:
        print("   (none)")
    print()
    return subs

def clear_messages(subject):
    """Clear messages from subscription"""
    print(f"🗑️  Clearing messages from: {subject}")
    response = requests.delete(f"{BASE_URL}/subscriptions/{subject}/messages")
    print(f"   Response: {response.json()}\n")

def unsubscribe(subject):
    """Stop subscription"""
    print(f"❌ Unsubscribing from: {subject}")
    response = requests.post(
        f"{BASE_URL}/unsubscribe",
        json={"subject": subject}
    )
    print(f"   Response: {response.json()}\n")

def main():
    print("=" * 50)
    print("NATS Pub/Sub Example with natsman")
    print("=" * 50)
    print()

    subject = "test.example"

    # 1. Subscribe
    subscribe(subject)
    time.sleep(0.5)

    # 2. Check subscriptions
    get_subscriptions()

    # 3. Publish some messages
    publish(subject, {
        "event": "user.created",
        "userId": "123",
        "username": "alice"
    })
    time.sleep(0.5)

    publish(subject, {
        "event": "user.updated",
        "userId": "123",
        "email": "alice@example.com"
    })
    time.sleep(0.5)

    publish(subject, {
        "event": "user.deleted",
        "userId": "123"
    })
    time.sleep(0.5)

    # 4. Get messages
    get_messages(subject)

    # 5. Clear messages
    clear_messages(subject)
    time.sleep(0.5)

    # 6. Verify cleared
    get_messages(subject)

    # 7. Unsubscribe
    unsubscribe(subject)
    time.sleep(0.5)

    # 8. Check subscriptions again
    get_subscriptions()

    print("=" * 50)
    print("Example Complete!")
    print("=" * 50)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to natsman server")
        print("   Make sure the server is running on http://localhost:8080")
    except Exception as e:
        print(f"❌ Error: {e}")

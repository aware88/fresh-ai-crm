#!/bin/bash

# Run Stripe webhook tester

# Check if .env file exists, if not create from sample
if [ ! -f ".env" ]; then
  if [ -f "test-subscription-flow.env.sample" ]; then
    echo "⚠️ No .env file found. Creating from sample..."
    cp test-subscription-flow.env.sample .env
    echo "⚠️ Please edit .env file with your actual values before running the test."
    exit 1
  else
    echo "❌ Error: No .env file or sample found."
    exit 1
  fi
fi

# Load environment variables
set -a
source .env
set +a

# Check if event type is provided
if [ -z "$1" ]; then
  echo "❌ Error: No event type provided."
  echo "Usage: $0 <event-type> [organization-id] [customer-id]"
  echo "Available event types:"
  echo "  - checkout.session.completed"
  echo "  - customer.subscription.created"
  echo "  - customer.subscription.updated"
  echo "  - customer.subscription.deleted"
  echo "  - invoice.payment_succeeded"
  echo "  - invoice.payment_failed"
  exit 1
fi

# Run the webhook tester
echo "🚀 Simulating Stripe webhook event: $1"
node webhook-tester.js "$@"

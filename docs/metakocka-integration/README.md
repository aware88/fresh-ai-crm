# Metakocka Integration Documentation

This documentation provides a comprehensive overview of the Metakocka ERP integration with the CRM Mind system. The integration enables seamless data flow between the CRM and Metakocka ERP, enhancing customer relationship management with real-time business data.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Integration Components](#integration-components)
4. [Authentication](#authentication)
5. [Data Synchronization](#data-synchronization)
6. [Email Integration](#email-integration)
7. [AI Features](#ai-features)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## Overview

The Metakocka integration connects the CRM Mind system with the Metakocka ERP platform, providing a unified view of customer data, sales documents, products, and interactions. This integration enables:

- Bidirectional contact synchronization
- Sales document creation and management
- Product catalog synchronization
- Email enrichment with Metakocka data
- AI-powered context building for customer interactions
- Smart email templates with Metakocka data placeholders
- AI-generated email responses using Metakocka context

## Architecture

The integration follows a modular architecture with these key components:

- **Authentication Layer**: Securely manages Metakocka API credentials
- **Data Synchronization Layer**: Handles bidirectional data flow
- **Mapping Layer**: Maintains relationships between CRM and Metakocka entities
- **Email Processing Layer**: Enriches emails with Metakocka data
- **AI Context Builder**: Creates rich context from multiple data sources
- **Template Engine**: Processes email templates with Metakocka placeholders

See the [Architecture Document](./architecture.md) for detailed diagrams and component descriptions.

## Integration Components

The Metakocka integration consists of several key components:

1. **Contact Integration**: Synchronize contacts between CRM and Metakocka
2. **Sales Document Integration**: Manage invoices, offers, and orders
3. **Product Integration**: Synchronize product catalog and inventory
4. **Email Integration**: Enrich emails with Metakocka data
5. **AI Context Builder**: Generate rich context for AI processing
6. **Email Templates**: Create templates with Metakocka data placeholders

Each component is documented in detail in its own document within this directory.

## Documentation Structure

- [Architecture Overview](./architecture.md)
- [Contact Integration](./contact-integration.md)
- [Sales Document Integration](./sales-document-integration.md)
- [Product Integration](./product-integration.md)
- [Email Integration](./email-integration.md)
- [AI Context Builder](./ai-context-builder.md)
- [Email Templates](./email-templates.md)
- [Auto-Sync System](./auto-sync.md) - **NEW: Automatic background synchronization**
- [Testing Guide](./testing-guide.md)
- [Recent Changes](./recent-changes.md)
- [Open Tasks](./open-tasks.md)

## Quick Links

- [Metakocka API Documentation](https://metakocka.com/metakocka_api/rest_api/)
- [Test Scripts](../test-scripts.md)
- [Database Schema](./database-schema.md)
- [Troubleshooting Guide](./troubleshooting.md)

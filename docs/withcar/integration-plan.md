# Metakocka & Outlook Integration Plan for CRM Mind

## Overview

This document outlines the implementation plan for enhancing CRM Mind with comprehensive Metakocka integration and creating a full-featured email client to replace Outlook.

## Current Implementation Status

### ✅ ALREADY IMPLEMENTED

1. **Metakocka Integration**
   - ✅ Bidirectional synchronization for products, contacts, and sales documents
   - ✅ Inventory management with availability checking
   - ✅ Comprehensive error logging and management system
   - ✅ Testing infrastructure for all sync operations

2. **RBAC System**
   - ✅ Complete role-based access control with granular permissions
   - ✅ Frontend components for permission-based rendering
   - ✅ API route protection

3. **Notification System**
   - ✅ User notification preferences
   - ✅ Email integration for important notifications
   - ✅ Scheduled notification jobs

4. **Subscription System**
   - ✅ Five pricing tiers with feature flags
   - ✅ Stripe integration for payments
   - ✅ Subscription management UI

## Feature Gap Analysis

### Inbox / UI Needs
- ❌ Unified inbox with country filter
- ❌ E-mail tags with color options
- ❌ Comment field on each e-mail
- ❌ Drag-and-drop attachments with preview
- ❌ Custom signatures per user
- ❌ Auto-language detection

### AI Adaptability
- ⚠️ AI e-mail generator exists but needs enhancements
- ❌ Prompt rule editor for sales team
- ❌ AI learning from past replies (RAG implementation)
- ❌ Graceful fallback for AI uncertainty

### External System Integration
- ❌ Metakocka status code mapping to readable text
- ❌ Magento product catalog integration
- ❌ Facebook page inbox integration
- ❌ Outlook integration (critical component)

## Implementation Plan

### Sprint 0 – Critical Outlook Integration (Estimated: 14-21 days)

1. **Microsoft Graph API Integration**
   - Implement Microsoft Graph API client for email access
   - Set up OAuth authentication flow for user accounts
   - Create email synchronization service (inbox, sent, drafts)
   - Implement real-time updates using webhooks or polling
   - Add caching layer for improved performance

2. **Email Client UI**
   - Create unified inbox view with folder structure
   - Implement email thread view with conversation tracking
   - Build email composer with formatting tools
   - Add calendar integration for meeting scheduling
   - Create contact sidebar for quick access to contact information

### Sprint 1 – Email Client Enhancements (Estimated: 7-10 days)

1. **E-mail Tags + Colors**
   - Create email_tags table with color options
   - Add tag selector component to email UI
   - Implement filtering by tags

2. **Comment Field**
   - Add comments table related to emails
   - Create comment component in email view
   - Add comment history tracking

3. **Drag & Drop Image Upload**
   - Implement drag-drop zone in email composer
   - Add image preview functionality
   - Ensure proper attachment handling

4. **Signature Editor**
   - Add signature field to user settings
   - Create WYSIWYG editor for signatures
   - Implement signature insertion in email composer

5. **Language Detection Logic**
   - Integrate with language detection API
   - Store detected language with emails
   - Add UI indicator for detected language

### Sprint 2 – Email Organization (Estimated: 10-14 days)

1. **Left-side Country Filter UI**
   - Add country metadata to emails
   - Create filterable sidebar component
   - Implement country-based inbox filtering

2. **Metakocka Status Mapping**
   - Create mapping table for Metakocka status codes
   - Add translation support for multiple languages
   - Update UI to display human-readable status

3. **Prompt Rules Editor**
   - Create prompt_rules table
   - Build UI for managing rules
   - Implement rule processing in AI generation flow

### Sprint 3 – Advanced Logic (Estimated: 14-21 days)

1. **Magento Catalog Integration**
   - Create import service for Magento products
   - Implement CSV parser or API client
   - Build product mapping and synchronization

2. **RAG Retrieval for Products**
   - Set up vector database for product information
   - Implement embedding generation for products
   - Create retrieval system for AI context

3. **AI Fallback Draft Logic**
   - Implement confidence scoring for AI responses
   - Create fallback templates for low confidence
   - Add human review workflow for uncertain cases

### Sprint 4 – External Channels (Estimated: 7-10 days)

1. **Facebook Inbox Integration**
   - Implement Meta Graph API client
   - Create message synchronization service
   - Build unified inbox experience with Facebook messages
   - Add reply handling and status tracking

## Alternative Approach: Microsoft 365 Embedded Experience

As an alternative to building a full email client from scratch, we could explore using Microsoft's Embedded Experience:

1. **Microsoft 365 Embedding**
   - Use Microsoft Graph Toolkit to embed Outlook directly
   - Implement single sign-on for seamless experience
   - Create custom UI wrapper around embedded components
   - Add CRM-specific features on top of embedded Outlook

This approach could significantly reduce development time while still providing a seamless experience for users. However, it would limit our ability to customize certain aspects of the email experience.

## Development Approach

1. **Initial Technical Investigation**
   - Evaluate Microsoft Graph API capabilities vs. requirements
   - Test Microsoft Graph Toolkit embedding approach
   - Determine the best approach based on customization needs

2. **Database Schema Changes**
   - Design schemas to support email integration and features

3. **Backend Services**
   - Implement synchronization and data processing services

4. **Frontend Components**
   - Build UI components and integration points

5. **Testing & Documentation**
   - Comprehensive testing of email flows and integration
   - Document all features and integration points

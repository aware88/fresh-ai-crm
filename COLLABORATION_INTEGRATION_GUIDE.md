# Team Collaboration Integration Guide

## Quick Start

### 1. Basic Setup
Wrap your app or component with the TeamCollaborationProvider:

```tsx
import { TeamCollaborationProvider } from '@/components/collaboration/TeamCollaborationProvider';

function App() {
  return (
    <TeamCollaborationProvider>
      {/* Your app content */}
    </TeamCollaborationProvider>
  );
}
```

### 2. Add Collaborative Notes
Replace your existing notes component:

```tsx
import CollaborativeNotes from '@/components/collaboration/CollaborativeNotes';

function CustomerView({ customerEmail }) {
  return (
    <CollaborativeNotes customerEmail={customerEmail} />
  );
}
```

### 3. Add Team Activity Feed
Show real-time team activity:

```tsx
import TeamActivityFeed from '@/components/collaboration/TeamActivityFeed';

function Sidebar() {
  return (
    <TeamActivityFeed 
      customerEmail="optional-filter@example.com"
      maxHeight="400px"
    />
  );
}
```

### 4. Add Team Presence
Show who's online:

```tsx
import TeamPresence from '@/components/collaboration/TeamPresence';

function Header() {
  return (
    <TeamPresence compact={true} />
  );
}
```

### 5. Full Dashboard
Complete collaboration dashboard:

```tsx
import CollaborationDashboard from '@/components/collaboration/CollaborationDashboard';

function TeamPage() {
  return (
    <CollaborationDashboard />
  );
}
```

## Demo

Run the demo to see all features:
```bash
npm run dev
```

Navigate to `/collaboration-demo` or use the updated CustomerInfoDemo component.

## Key Features Implemented

✅ **Real-time collaborative notes** with mentions (@username)  
✅ **Note reactions** (👍, ❤️, 👏) and threaded replies  
✅ **Team presence indicators** (online, away, busy, offline)  
✅ **Activity feed** with smart filtering  
✅ **Note prioritization** (low, medium, high, urgent)  
✅ **Tag system** (#urgent, #follow-up, #vip-customer)  
✅ **Assignment system** for team members  
✅ **Private notes** and note pinning  
✅ **Enhanced customer sidebar** with collaboration tabs  
✅ **Team dashboard** with metrics and analytics  

## Modern App Features Inspired By:

- **Slack**: Real-time messaging, mentions, reactions, presence
- **Notion**: Rich note-taking, collaborative editing, tagging
- **Linear**: Priority levels, status tracking, clean UI
- **Asana**: Task assignment, team collaboration, progress tracking

This creates a comprehensive team collaboration system that transforms your customer management into a modern, collaborative workspace!
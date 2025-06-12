-- Seed data for interactions table
-- This script populates the interactions table with initial data

-- Clear existing data (be careful with this in production)
TRUNCATE TABLE interactions RESTART IDENTITY CASCADE;

-- Insert sample interactions
-- Format: (id, contact_id, type, subject, content, sentiment, personalityInsights, date)

-- Interactions for Sarah Johnson (CEO)
INSERT INTO interactions (id, contact_id, type, subject, content, sentiment, personalityInsights, date) VALUES
('int-1a2b3c4d-5e6f-4a3b-8c7d-9e8f7a6b5c4d', '1a2b3c4d-5e6f-4a3b-8c7d-9e8f7a6b5c4d', 'email', 'Q2 Strategy Meeting', 'Sarah, I wanted to follow up on our discussion about the Q2 strategy. I\'ve prepared the deck we discussed and would like to schedule a call to review it with you.', 'neutral', '{"confidence": 0.92, "traits": ["assertive", "goal-oriented", "direct"], "preferredCommunication": "concise emails"}', '2025-05-28 14:30:00+00'),

-- Interactions for Michael Chen (CMO)
('int-2b3c4d5e-6f7a-4b3c-9d8e-7f6a5b4c3d2e', '2b3c4d5e-6f7a-4b3c-9d8e-7f6a5b4c3d2e', 'meeting', 'Marketing Campaign Review', 'Had a great discussion about the upcoming product launch campaign. Michael provided valuable insights into our target demographics.', 'positive', '{"confidence": 0.88, "traits": ["collaborative", "enthusiastic", "relationship-focused"], "preferredCommunication": "in-person meetings"}', '2025-05-25 10:15:00+00'),

-- Interactions for Emily Rodriguez (Sales Director)
('int-3c4d5e6f-7a8b-4c5d-9e8f-7a6b5c4d3e2f', '3c4d5e6f-7a8b-4c5d-9e8f-7a6b5c4d3e2f', 'call', 'Q2 Sales Pipeline', 'Discussed the current sales pipeline and strategies to improve conversion rates. Emily highlighted some concerns about the new pricing model.', 'neutral', '{"confidence": 0.85, "traits": ["personable", "persuasive", "energetic"], "preferredCommunication": "video calls"}', '2025-05-30 11:45:00+00'),

-- Interactions for David Kim (CTO)
('int-4d5e6f7a-8b9c-4d5e-9f0a-1b2c3d4e5f6a', '4d5e6f7a-8b9c-4d5e-9f0a-1b2c3d4e5f6a', 'email', 'Technical Architecture Review', 'David, I\'ve reviewed the technical architecture document. The approach looks solid, but I have some questions about the scalability aspects.', 'analytical', '{"confidence": 0.94, "traits": ["logical", "precise", "detail-oriented"], "preferredCommunication": "technical documentation"}', '2025-05-20 09:30:00+00'),

-- Interactions for Jessica Patel (Head of Customer Success)
('int-5e6f7a8b-9c0d-4e5f-8a7b-6c5d4e3f2a1b', '5e6f7a8b-9c0d-4e5f-8a7b-6c5d4e3f2a1b', 'meeting', 'Customer Feedback Analysis', 'Reviewed recent customer feedback with Jessica. She provided excellent insights into common pain points and suggested several product improvements.', 'positive', '{"confidence": 0.89, "traits": ["empathetic", "organized", "reliable"], "preferredCommunication": "scheduled meetings"}', '2025-05-29 15:20:00+00'),

-- Interactions for Ryan O'Connor (Product Manager)
('int-6f7a8b9c-0d1e-4f5a-8b9c-7d6e5f4a3b2c', '6f7a8b9c-0d1e-4f5a-8b9c-7d6e5f4a3b2c', 'call', 'Product Roadmap Discussion', 'Brainstorming session about the next product features. Ryan had several innovative ideas that could give us a competitive edge.', 'positive', '{"confidence": 0.91, "traits": ["creative", "visionary", "spontaneous"], "preferredCommunication": "brainstorming sessions"}', '2025-05-27 13:10:00+00'),

-- Interactions for Jennifer Wong (CFO)
('int-7a8b9c0d-1e2f-4a3b-8c7d-6e5f4a3b2c1d', '7a8b9c0d-1e2f-4a3b-8c7d-6e5f4a3b2c1d', 'email', 'Q2 Financial Projections', 'Jennifer, I\'ve prepared the Q2 financial projections as requested. The numbers look promising, with a projected 15% increase in revenue.', 'positive', '{"confidence": 0.93, "traits": ["detail-oriented", "cautious", "fact-based"], "preferredCommunication": "detailed reports"}', '2025-05-15 16:45:00+00'),

-- Interactions for Marcus Thompson (Lead Designer)
('int-8b9c0d1e-2f3a-4b5c-8d7e-6f5a4b3c2d1e', '8b9c0d1e-2f3a-4b5c-8d7e-6f5a4b3c2d1e', 'meeting', 'UI/UX Review', 'Reviewed the new UI/UX designs with Marcus. His attention to detail and user-centered approach was impressive.', 'positive', '{"confidence": 0.87, "traits": ["creative", "intuitive", "user-focused"], "preferredCommunication": "visual presentations"}', '2025-05-22 14:20:00+00'),

-- Interactions for Olivia Martinez (HR Director)
('int-9c0d1e2f-3a4b-4c5d-8e9f-7a6b5c4d3e2f', '9c0d1e2f-3a4b-4c5d-8e9f-7a6b5c4d3e2f', 'call', 'Team Building Activities', 'Discussed upcoming team building activities. Olivia shared some great ideas for improving team morale and collaboration.', 'positive', '{"confidence": 0.9, "traits": ["empathetic", "supportive", "diplomatic"], "preferredCommunication": "one-on-one conversations"}', '2025-05-18 10:30:00+00'),

-- Interactions for Daniel Brown (IT Manager)
('int-0d1e2f3a-4b5c-4d5e-9f0a-1b2c3d4e5f6a', '0d1e2f3a-4b5c-4d5e-9f0a-1b2c3d4e5f6a', 'email', 'System Upgrade Schedule', 'Daniel, I\'ve reviewed the proposed system upgrade schedule. The timeline looks reasonable, but we might need to adjust for the accounting close.', 'neutral', '{"confidence": 0.92, "traits": ["technical", "efficient", "problem-solver"], "preferredCommunication": "direct messages"}', '2025-05-10 11:15:00+00');

-- Add comments for documentation
COMMENT ON TABLE interactions IS 'Stores interaction history with contacts for the CRM Mind system';

-- Output success message
SELECT 'Successfully seeded interactions table with ' || COUNT(*) || ' records.' AS message FROM interactions;

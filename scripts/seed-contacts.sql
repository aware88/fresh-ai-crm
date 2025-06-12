-- Seed data for contacts table
-- This script populates the contacts table with initial data

-- Clear existing data (be careful with this in production)
TRUNCATE TABLE contacts RESTART IDENTITY CASCADE;

-- Insert sample contacts
INSERT INTO contacts (
  id, firstName, lastName, email, phone, company, position, personalityType, notes, lastContact, lastInteraction
) VALUES 
-- Executive Team
('1a2b3c4d-5e6f-4a3b-8c7d-9e8f7a6b5c4d', 'Sarah', 'Johnson', 'sarah.johnson@techcorp.com', '+1-555-010-1234', 'TechCorp', 'CEO', 'ENTJ', 'Prefers email communication. Very direct and to the point.', '2025-05-28 14:30:00+00', '2025-05-28 14:30:00+00'),

-- Marketing Team
('2b3c4d5e-6f7a-4b3c-9d8e-7f6a5b4c3d2e', 'Michael', 'Chen', 'michael.chen@techcorp.com', '+1-555-010-2345', 'TechCorp', 'CMO', 'ENFJ', 'Likes detailed proposals. Very relationship-focused.', '2025-05-25 10:15:00+00', '2025-05-25 10:15:00+00'),

-- Sales Team
('3c4d5e6f-7a8b-4c5d-9e8f-7a6b5c4d3e2f', 'Emily', 'Rodriguez', 'emily.rodriguez@techcorp.com', '+1-555-010-3456', 'TechCorp', 'Sales Director', 'ESFJ', 'Prefers video calls. Very personable and warm.', '2025-05-30 11:45:00+00', '2025-05-30 11:45:00+00'),

-- Engineering Team
('4d5e6f7a-8b9c-4d5e-9f0a-1b2c3d4e5f6a', 'David', 'Kim', 'david.kim@techcorp.com', '+1-555-010-4567', 'TechCorp', 'CTO', 'INTP', 'Prefers technical documentation. Very analytical.', '2025-05-20 09:30:00+00', '2025-05-20 09:30:00+00'),

-- Customer Success
('5e6f7a8b-9c0d-4e5f-8a7b-6c5d4e3f2a1b', 'Jessica', 'Patel', 'jessica.patel@techcorp.com', '+1-555-010-5678', 'TechCorp', 'Head of Customer Success', 'ISFJ', 'Very detail-oriented. Prefers scheduled meetings.', '2025-05-29 15:20:00+00', '2025-05-29 15:20:00+00'),

-- Product Team
('6f7a8b9c-0d1e-4f5a-8b9c-7d6e5f4a3b2c', 'Ryan', 'O\'Connor', 'ryan.oconnor@techcorp.com', '+1-555-010-6789', 'TechCorp', 'Product Manager', 'ENTP', 'Likes to brainstorm. Very innovative thinker.', '2025-05-27 13:10:00+00', '2025-05-27 13:10:00+00'),

-- Finance Team
('7a8b9c0d-1e2f-4a3b-8c7d-6e5f4a3b2c1d', 'Jennifer', 'Wong', 'jennifer.wong@techcorp.com', '+1-555-010-7890', 'TechCorp', 'CFO', 'ISTJ', 'Very numbers-driven. Prefers detailed reports.', '2025-05-15 16:45:00+00', '2025-05-15 16:45:00+00'),

-- Design Team
('8b9c0d1e-2f3a-4b5c-8d7e-6f5a4b3c2d1e', 'Marcus', 'Thompson', 'marcus.thompson@techcorp.com', '+1-555-010-8901', 'TechCorp', 'Lead Designer', 'INFP', 'Very creative. Prefers visual presentations.', '2025-05-22 14:20:00+00', '2025-05-22 14:20:00+00'),

-- HR Team
('9c0d1e2f-3a4b-4c5d-8e9f-7a6b5c4d3e2f', 'Olivia', 'Martinez', 'olivia.martinez@techcorp.com', '+1-555-010-9012', 'TechCorp', 'HR Director', 'ENFJ', 'Very people-oriented. Great listener.', '2025-05-18 10:30:00+00', '2025-05-18 10:30:00+00'),

-- IT Team
('0d1e2f3a-4b5c-4d5e-9f0a-1b2c3d4e5f6a', 'Daniel', 'Brown', 'daniel.brown@techcorp.com', '+1-555-010-0123', 'TechCorp', 'IT Manager', 'ISTP', 'Very technical. Prefers direct communication.', '2025-05-10 11:15:00+00', '2025-05-10 11:15:00+00');

-- Add comments for documentation
COMMENT ON TABLE contacts IS 'Stores contact information for the CRM Mind system';

-- Output success message
SELECT 'Successfully seeded contacts table with ' || COUNT(*) || ' records.' AS message FROM contacts;

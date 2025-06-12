-- Seed data for files table
-- This script populates the files table with initial data

-- Clear existing data (be careful with this in production)
TRUNCATE TABLE files RESTART IDENTITY CASCADE;

-- Insert sample files
-- Format: (id, filename, original_name, content_type, size, path, contact_id, description, tags)

-- Files for Sarah Johnson (CEO)
INSERT INTO files (id, filename, original_name, content_type, size, path, contact_id, description, tags) VALUES
('file-1a2b3c4d-5e6f-4a3b-8c7d-9e8f7a6b5c4d', 'q2-strategy-2025.pdf', 'Q2-Strategy-2025.pdf', 'application/pdf', 2456789, 'uploads/strategies/q2-strategy-2025.pdf', '1a2b3c4d-5e6f-4a3b-8c7d-9e8f7a6b5c4d', 'Q2 2025 Company Strategy Document', '{"strategy", "presentation", "executive"}'),

-- Files for Michael Chen (CMO)
('file-2b3c4d5e-6f7a-4b3c-9d8e-7f6a5b4c3d2e', 'marketing-campaign-q2-2025.pdf', 'Marketing-Campaign-Q2-2025.pdf', 'application/pdf', 1876543, 'uploads/marketing/campaign-q2-2025.pdf', '2b3c4d5e-6f7a-4b3c-9d8e-7f6a5b4c3d2e', 'Q2 2025 Marketing Campaign Plan', '{"marketing", "campaign", "presentation"}'),

-- Files for Emily Rodriguez (Sales Director)
('file-3c4d5e6f-7a8b-4c5d-9e8f-7a6b5c4d3e2f', 'sales-forecast-q2-2025.xlsx', 'Sales-Forecast-Q2-2025.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 345678, 'uploads/sales/forecast-q2-2025.xlsx', '3c4d5e6f-7a8b-4c5d-9e8f-7a6b5c4d3e2f', 'Q2 2025 Sales Forecast', '{"sales", "forecast", "spreadsheet"}'),

-- Files for David Kim (CTO)
('file-4d5e6f7a-8b9c-4d5e-9f0a-1b2c3d4e5f6a', 'technical-architecture-v3.pdf', 'Technical-Architecture-v3.pdf', 'application/pdf', 4567890, 'uploads/tech/architecture-v3.pdf', '4d5e6f7a-8b9c-4d5e-9f0a-1b2c3d4e5f6a', 'System Architecture Document v3.0', '{"technical", "architecture", "documentation"}'),

-- Files for Jessica Patel (Head of Customer Success)
('file-5e6f7a8b-9c0d-4e5f-8a7b-6c5d4e3f2a1b', 'customer-feedback-q2-2025.xlsx', 'Customer-Feedback-Q2-2025.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 234567, 'uploads/customers/feedback-q2-2025.xlsx', '5e6f7a8b-9c0d-4e5f-8a7b-6c5d4e3f2a1b', 'Q2 2025 Customer Feedback Analysis', '{"feedback", "analysis", "customer-success"}'),

-- Files for Ryan O'Connor (Product Manager)
('file-6f7a8b9c-0d1e-4f5a-8b9c-7d6e5f4a3b2c', 'product-roadmap-2025.pdf', 'Product-Roadmap-2025.pdf', 'application/pdf', 3456789, 'uploads/product/roadmap-2025.pdf', '6f7a8b9c-0d1e-4f5a-8b9c-7d6e5f4a3b2c', '2025 Product Roadmap', '{"product", "roadmap", "strategy"}'),

-- Files for Jennifer Wong (CFO)
('file-7a8b9c0d-1e2f-4a3b-8c7d-6e5f4a3b2c1d', 'financial-forecast-q2-2025.xlsx', 'Financial-Forecast-Q2-2025.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 456789, 'uploads/finance/forecast-q2-2025.xlsx', '7a8b9c0d-1e2f-4a3b-8c7d-6e5f4a3b2c1d', 'Q2 2025 Financial Forecast', '{"finance", "forecast", "budget"}'),

-- Files for Marcus Thompson (Lead Designer)
('file-8b9c0d1e-2f3a-4b5c-8d7e-6f5a4b3c2d1e', 'ui-ux-guidelines-2025.pdf', 'UI-UX-Guidelines-2025.pdf', 'application/pdf', 5678901, 'uploads/design/guidelines-2025.pdf', '8b9c0d1e-2f3a-4b5c-8d7e-6f5a4b3c2d1e', '2025 UI/UX Design Guidelines', '{"design", "ui", "ux", "guidelines"}'),

-- Files for Olivia Martinez (HR Director)
('file-9c0d1e2f-3a4b-4c5d-8e9f-7a6b5c4d3e2f', 'employee-handbook-2025.pdf', 'Employee-Handbook-2025.pdf', 'application/pdf', 3456789, 'uploads/hr/handbook-2025.pdf', '9c0d1e2f-3a4b-4c5d-8e9f-7a6b5c4d3e2f', '2025 Employee Handbook', '{"hr", "handbook", "policies"}'),

-- Files for Daniel Brown (IT Manager)
('file-0d1e2f3a-4b5c-4d5e-9f0a-1b2c3d4e5f6a', 'it-security-policy-2025.pdf', 'IT-Security-Policy-2025.pdf', 'application/pdf', 2345678, 'uploads/it/security-policy-2025.pdf', '0d1e2f3a-4b5c-4d5e-9f0a-1b2c3d4e5f6a', '2025 IT Security Policy', '{"it", "security", "policy"}');

-- Add comments for documentation
COMMENT ON TABLE files IS 'Stores metadata for files uploaded to the CRM Mind system';

-- Output success message
SELECT 'Successfully seeded files table with ' || COUNT(*) || ' records.' AS message FROM files;

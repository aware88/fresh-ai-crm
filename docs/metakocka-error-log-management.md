# Metakocka Error Log Management

## Overview

The Metakocka Error Log Management system provides a comprehensive solution for tracking, analyzing, and resolving integration errors between Fresh AI CRM and the Metakocka ERP system. This document outlines the features, usage, and technical details of the error log management system.

## Features

### Core Features

1. **Error Logging and Tracking**
   - Automatic capture of errors during Metakocka integration operations
   - Detailed error context and metadata storage
   - Multi-tenant isolation of error logs

2. **Error Resolution Workflow**
   - Individual error resolution with notes
   - Bulk resolution for multiple errors
   - Resolution history tracking

3. **Advanced Filtering and Search**
   - Filter by error level, category, date range, and resolution status
   - Save and reuse common filters
   - Full-text search across error messages and context

4. **Analytics and Reporting**
   - Enhanced statistics dashboard with error trends
   - Category distribution analysis
   - Resolution rate tracking
   - Export capabilities for offline analysis

5. **Error Categorization and Tagging**
   - Custom tagging system for error organization
   - Tag-based filtering and grouping
   - Tag management interface

## User Guide

### Accessing the Error Logs

Navigate to **Integrations > Metakocka > Logs** in the main navigation menu to access the error log management interface.

### Understanding the Interface

1. **Page Header**
   - Quick filter buttons for common views (Unresolved Errors, Warnings, All Logs)
   - Advanced filter panel access
   - Refresh button to update the log list
   - Export button to download logs as CSV

2. **Statistics Dashboard**
   - Error count by category
   - Error trends over time
   - Resolution rate metrics
   - Quick insights into system health

3. **Log List**
   - Individual log entries with expandable details
   - Visual indicators for error severity
   - Resolution status badges
   - Tag display and management

4. **Bulk Actions Panel**
   - Appears when bulk selection mode is active
   - Options for resolving multiple logs at once
   - Selection helpers (Select All, Clear All)

### Working with Error Logs

#### Viewing Log Details

Click on any log entry to open the detailed view, which includes:
- Complete error message and context
- Stack trace (if available)
- Related entity information
- Resolution history
- Tags and categorization

#### Resolving Errors

1. **Individual Resolution**
   - Click the "Resolve Issue" button on a log entry
   - Add optional resolution notes
   - Click "Mark as Resolved"

2. **Bulk Resolution**
   - Click "Bulk Select" to enter selection mode
   - Select logs using checkboxes
   - Use the bulk actions panel to resolve selected logs
   - Add optional resolution notes that apply to all selected logs

#### Using Filters

1. **Quick Filters**
   - Use the preset buttons for common views (Unresolved Errors, Warnings, All Logs)

2. **Advanced Filtering**
   - Click the filter icon to open the advanced filter panel
   - Set multiple filter criteria (level, category, date range, etc.)
   - Save frequently used filters with custom names
   - Apply or clear filters as needed

#### Managing Tags

1. **Adding Tags**
   - Click the "+" button in the Tags section of a log entry
   - Enter a new tag name and click "Add"

2. **Removing Tags**
   - Enter tag editing mode by clicking the "+" button
   - Click the "X" next to any tag to remove it

3. **Filtering by Tags**
   - Use the advanced filter panel to filter logs by specific tags

#### Exporting Logs

1. Click the "Export CSV" button in the page header
2. The system will generate a CSV file containing all currently filtered logs
3. The file will be downloaded to your device with a filename including the current date

#### Keyboard Shortcuts

The error log management system includes keyboard shortcuts for power users:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `B` | Toggle Bulk Mode | Enter or exit bulk selection mode |
| `A` | Select All | Select all visible logs (when in bulk mode) |
| `C` | Clear Selection | Clear all selected logs (when in bulk mode) |
| `Ctrl+R` / `Cmd+R` | Refresh | Refresh the log list with current filters |
| `Ctrl+E` / `Cmd+E` | Export | Export current logs to CSV |

These shortcuts are designed to improve workflow efficiency for users who frequently work with error logs.

## Technical Details

### Database Schema

The error log management system uses the `metakocka_error_logs` table with the following structure:

```sql
CREATE TABLE metakocka_error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  tenant_id UUID REFERENCES auth.users(id),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_notes TEXT,
  resolution_timestamp TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### API Endpoints

1. **GET /api/integrations/metakocka/logs**
   - Fetches logs with optional filtering
   - Supports pagination

2. **POST /api/integrations/metakocka/logs**
   - Resolves a single log entry

3. **GET /api/integrations/metakocka/logs/stats**
   - Retrieves error statistics

4. **POST /api/integrations/metakocka/logs/bulk-resolve**
   - Resolves multiple log entries at once

5. **POST /api/integrations/metakocka/logs/tags**
   - Updates tags for a log entry

### Client-Side Components

1. **LogEntryCard**: Displays individual log entries with expandable details
2. **LogDetailDialog**: Shows comprehensive log information in a modal dialog
3. **FilterPanel**: Provides advanced filtering capabilities
4. **StatsDashboard**: Displays error statistics and trends
5. **BulkActionsPanel**: Manages bulk operations on selected logs
6. **ErrorTags**: Manages tags for individual log entries
7. **ExportLogsButton**: Handles CSV export functionality

## Troubleshooting

### Common Issues

1. **Missing Logs**
   - Verify that the user has the correct permissions
   - Check that the tenant_id is correctly set for multi-tenant isolation
   - Ensure the error logger is properly configured in all integration points

2. **Filter Not Working**
   - Clear all filters and try again with a single filter criterion
   - Check for any special characters in filter values
   - Verify date format in date range filters

3. **Bulk Actions Not Available**
   - Ensure you've entered bulk selection mode by clicking the "Bulk Select" button
   - Verify that at least one log entry is selected

4. **Export Failing**
   - Check that there are logs available to export
   - Verify browser permissions for downloads
   - Try reducing the number of logs by applying filters before exporting

## Testing

A comprehensive test suite is available to validate the error log management system functionality.

### Running the Tests

1. Navigate to the test directory:
   ```bash
   cd tests/metakocka
   ```

2. Copy the sample environment file:
   ```bash
   cp error-log-test.env.sample .env
   ```

3. Update the `.env` file with your authentication token:
   ```
   AUTH_TOKEN=your_auth_token_here
   ```

4. Run the test script:
   ```bash
   ./run-error-log-test.sh
   ```

### Test Coverage

The test script validates the following functionality:

1. **Fetching Logs**
   - Basic log retrieval with pagination
   - Verification of log structure and metadata

2. **Filtering Logs**
   - By error level (ERROR, WARNING, INFO)
   - By resolution status (resolved/unresolved)
   - By category (SYNC, AUTH, API, etc.)

3. **Log Resolution**
   - Individual log resolution with notes
   - Verification of resolution status

4. **Bulk Operations**
   - Bulk resolution of multiple logs
   - Verification of bulk operations

5. **Export Functionality**
   - CSV export of logs
   - Verification of export content

6. **Statistics**
   - Retrieval of error statistics
   - Verification of statistics structure

## Future Enhancements

1. **Real-time Log Updates**
   - WebSocket integration for live log updates
   - Push notifications for critical errors

2. **Advanced Analytics**
   - Correlation analysis between different error types
   - Predictive analytics for error prevention
   - Custom reporting dashboards

3. **Automated Resolution**
   - AI-powered suggestions for error resolution
   - Automated resolution for common error patterns
   - Self-healing integration capabilities

4. **Integration with External Systems**
   - Export to third-party monitoring tools
   - Integration with ticketing systems
   - Slack/Teams notifications for critical errors

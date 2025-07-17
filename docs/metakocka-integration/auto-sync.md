# Metakocka Auto-Sync System

## Overview

The Metakocka Auto-Sync system enables automatic background synchronization between your CRM and Metakocka ERP, eliminating the need for manual sync button presses. This system is designed to make your CRM act as Metakocka's "longer arm" by keeping all data fresh and synchronized automatically.

## Key Features

- **Automatic Background Sync**: No more manual button pressing
- **Configurable Intervals**: Set different sync frequencies for different data types
- **Directional Control**: Choose sync direction per data type (Metakocka→CRM, CRM→Metakocka, or bidirectional)
- **Real-time Capabilities**: Optional real-time data fetching for critical operations
- **Error Resilience**: Comprehensive error handling and retry mechanisms
- **User-friendly Interface**: Easy-to-use control panel for configuration

## Accessing Auto-Sync

1. Navigate to **Settings > Integrations > Metakocka**
2. Ensure your Metakocka credentials are configured and tested
3. The **Auto-Sync Control** panel will appear below the credentials section

## Configuration Options

### Sync Intervals

Configure how often each data type syncs:

- **Products**: Default 30 minutes (recommended for inventory updates)
- **Invoices**: Default 15 minutes (recommended for sales tracking)
- **Contacts**: Default 60 minutes (recommended for customer data)
- **Inventory**: Default 10 minutes (recommended for stock levels)

### Sync Directions

Choose the data flow direction for each type:

- **Metakocka→CRM**: Data flows only from Metakocka to CRM (read-only from Metakocka)
- **CRM→Metakocka**: Data flows only from CRM to Metakocka (write to Metakocka)
- **Bidirectional**: Data syncs both ways (full synchronization)

### Real-time Options

- **Real-time Fetching**: Enable immediate data fetching for critical operations
- **Webhook Support**: Future support for Metakocka webhooks (when available)

## Recommended Settings

For CRMs acting as Metakocka's "longer arm" (managing emails, sales, support):

### Primary Use Case Configuration
```
Products: Metakocka→CRM, every 30 minutes
Invoices: Metakocka→CRM, every 15 minutes  
Contacts: Bidirectional, every 60 minutes
Inventory: Metakocka→CRM, every 10 minutes
Real-time: Enabled
```

### Why These Settings?
- **Products from Metakocka**: Metakocka is the master for product catalog
- **Invoices from Metakocka**: Metakocka handles billing and invoicing
- **Contacts bidirectional**: CRM manages customer communication, but needs Metakocka customer data
- **Inventory from Metakocka**: Metakocka manages stock levels
- **Real-time enabled**: For immediate access to critical data during operations

## How It Works

### Background Processing
The auto-sync system runs background timers that:
1. Check for new/updated data in the configured direction
2. Apply intelligent data merging (see Data Handling section)
3. Log all operations for transparency
4. Handle errors gracefully with retry logic

### Data Handling Strategy
When syncing data, the system:

#### For Metakocka→CRM (Read-only from Metakocka)
- **New records**: Creates new entries in CRM
- **Updated records**: Updates existing CRM records with Metakocka data
- **Deleted records**: Marks as inactive in CRM (preserves history)
- **Conflicts**: Metakocka data takes precedence

#### For CRM→Metakocka (Write to Metakocka)
- **New records**: Creates new entries in Metakocka
- **Updated records**: Updates existing Metakocka records
- **Validation**: Ensures data meets Metakocka requirements
- **Error handling**: Logs failures without affecting CRM data

#### For Bidirectional Sync
- **Timestamp-based**: Uses last_modified timestamps to determine winner
- **Conflict resolution**: Configurable rules for handling conflicts
- **Merge strategy**: Intelligent merging of non-conflicting fields

## Data Preservation

### What Gets Preserved
- **Historical data**: Previous versions are maintained
- **Custom fields**: CRM-specific fields are preserved
- **Relationships**: Links between records are maintained
- **Metadata**: Sync timestamps and status information

### What Gets Updated
- **Core business data**: Names, addresses, prices, quantities
- **Status information**: Active/inactive states, availability
- **Metakocka identifiers**: IDs and codes from Metakocka
- **Sync metadata**: Last sync times, status flags

## Safety Features

### Read-Only Protection
For the initial implementation, the system is configured for **read-only access from Metakocka**:
- No data is written to Metakocka automatically
- All sync operations are Metakocka→CRM only (except contacts if configured)
- This ensures your Metakocka data remains unchanged during testing

### Error Handling
- **Retry logic**: Failed operations are retried with exponential backoff
- **Error logging**: All errors are logged for review
- **Graceful degradation**: System continues working even if some syncs fail
- **Manual override**: You can always manually trigger syncs if needed

## Monitoring and Logs

### Sync Status
The control panel shows:
- **Active timers**: Which sync processes are running
- **Last sync times**: When each data type was last synchronized
- **Sync counts**: Number of records processed
- **Error status**: Any issues that need attention

### Detailed Logs
Access detailed sync logs at:
- **Integrations > Metakocka > Logs**
- Filter by sync operations, errors, or specific data types
- Export logs for analysis or troubleshooting

## Troubleshooting

### Common Issues

#### Auto-sync Not Starting
- **Check credentials**: Ensure Metakocka credentials are valid
- **Test connection**: Use the "Test Connection" button
- **Check permissions**: Ensure user has access to integration features

#### Sync Errors
- **Review logs**: Check the error logs for specific issues
- **Credential expiry**: Metakocka credentials may need renewal
- **Network issues**: Temporary connectivity problems

#### Data Not Updating
- **Check intervals**: Ensure sync intervals are appropriate
- **Verify direction**: Confirm sync direction is set correctly
- **Manual test**: Try a manual sync to isolate the issue

### Getting Help
1. Check the error logs for specific error messages
2. Review the sync status in the control panel
3. Test the connection to Metakocka
4. Contact support with specific error details

## Best Practices

### Initial Setup
1. **Test connection** first with valid Metakocka credentials
2. **Start with longer intervals** (30+ minutes) during testing
3. **Monitor logs** closely during the first few sync cycles
4. **Verify data accuracy** before enabling shorter intervals

### Ongoing Management
1. **Regular monitoring**: Check sync status weekly
2. **Log review**: Review error logs monthly
3. **Performance tuning**: Adjust intervals based on data volume
4. **Backup strategy**: Ensure regular backups before major changes

### Production Deployment
1. **Staging first**: Test all configurations in staging environment
2. **Gradual rollout**: Start with one data type, then expand
3. **Monitor performance**: Watch for impact on system performance
4. **User training**: Ensure team understands the new automated process

## API Reference

### Auto-Sync Endpoints

#### Get Auto-Sync Status
```
GET /api/integrations/metakocka/auto-sync
```

#### Configure Auto-Sync
```
POST /api/integrations/metakocka/auto-sync
Content-Type: application/json

{
  "enabled": true,
  "intervals": {
    "products": 30,
    "invoices": 15,
    "contacts": 60,
    "inventory": 10
  },
  "direction": {
    "products": "metakocka_to_crm",
    "invoices": "metakocka_to_crm",
    "contacts": "bidirectional"
  },
  "realTimeEnabled": true
}
```

#### Stop Auto-Sync
```
DELETE /api/integrations/metakocka/auto-sync
```

## Security Considerations

### Data Protection
- **Encryption**: All data is encrypted in transit and at rest
- **Access control**: Only authorized users can configure auto-sync
- **Audit trail**: All sync operations are logged for compliance

### Credential Management
- **Secure storage**: Metakocka credentials are encrypted in the database
- **Regular rotation**: Consider rotating credentials periodically
- **Least privilege**: Use Metakocka accounts with minimal required permissions

## Future Enhancements

### Planned Features
- **Webhook support**: Real-time sync when Metakocka supports webhooks
- **Advanced conflict resolution**: More sophisticated merge strategies
- **Selective sync**: Sync only specific products, contacts, or date ranges
- **Performance optimization**: Improved handling of large datasets

### Feedback and Requests
- Report issues or request features through the support system
- Monitor the changelog for updates and new capabilities
- Participate in beta testing for new features

---

*This documentation covers the Metakocka Auto-Sync system. For general Metakocka integration information, see the [main integration documentation](./README.md).* 
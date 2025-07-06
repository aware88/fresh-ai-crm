# Analytics System Documentation

## Overview

The Fresh AI CRM Analytics System provides comprehensive insights into various aspects of the CRM platform, including general metrics, subscription analytics, supplier distribution, product distribution, and price trends. The system is designed to help organizations make data-driven decisions by visualizing key performance indicators and trends.

## Architecture

The analytics system follows a client-server architecture:

1. **Backend API Endpoints**: Located in `/src/app/api/analytics/` directory
2. **API Client Functions**: Located in `/src/lib/analytics/api.ts`
3. **Frontend Components**: Located in `/src/app/dashboard/analytics/` and `/src/components/analytics/`

## API Endpoints

### General Analytics

- **Endpoint**: `/api/analytics`
- **Method**: GET
- **Description**: Returns general analytics data including counts of suppliers, products, documents, emails, and pricing statistics.
- **Authentication**: Requires authenticated session
- **Response Format**:
  ```json
  {
    "counts": {
      "suppliers": number,
      "products": number,
      "documents": number,
      "emails": number
    },
    "pricing": {
      "average": number,
      "minimum": number,
      "maximum": number
    }
  }
  ```

### Supplier Distribution

- **Endpoint**: `/api/analytics/suppliers`
- **Method**: GET
- **Description**: Returns data about supplier distribution.
- **Authentication**: Requires authenticated session

### Product Distribution

- **Endpoint**: `/api/analytics/products`
- **Method**: GET
- **Description**: Returns data about product category distribution.
- **Authentication**: Requires authenticated session

### Price Trends

- **Endpoint**: `/api/analytics/pricing`
- **Method**: GET
- **Description**: Returns data about price trends over time.
- **Authentication**: Requires authenticated session

### Subscription Analytics

- **Endpoint**: `/api/analytics/subscriptions`
- **Method**: GET
- **Query Parameters**: `organizationId` (required)
- **Description**: Returns detailed subscription analytics including revenue metrics, active subscriptions, plan distribution, and monthly revenue trends.
- **Authentication**: Requires authenticated session
- **Response Format**:
  ```json
  {
    "overview": {
      "totalRevenue": number,
      "lastMonthRevenue": number,
      "activeSubscriptions": number,
      "cancelledSubscriptions": number,
      "revenueGrowth": number
    },
    "planDistribution": [
      {
        "name": string,
        "count": number,
        "revenue": number
      }
    ],
    "monthlyRevenue": [
      {
        "month": string,
        "revenue": number
      }
    ]
  }
  ```

## Client API Functions

### `fetchAnalytics()`

Fetches general analytics data from the `/api/analytics` endpoint.

### `fetchSupplierDistribution()`

Fetches supplier distribution data from the `/api/analytics/suppliers` endpoint.

### `fetchProductDistribution()`

Fetches product distribution data from the `/api/analytics/products` endpoint.

### `fetchPriceTrends()`

Fetches price trend data from the `/api/analytics/pricing` endpoint.

### `fetchSubscriptionAnalytics(organizationId: string)`

Fetches subscription analytics data from the `/api/analytics/subscriptions` endpoint for the specified organization.

## Frontend Components

### Analytics Dashboard

- **Location**: `/src/app/dashboard/analytics/page.tsx`
- **Description**: Main dashboard page that integrates all analytics components and provides tab navigation.
- **Features**:
  - Overview statistics
  - Tab navigation for different analytics views
  - Data refresh functionality
  - Loading states and error handling

### Subscription Analytics Component

- **Location**: `/src/components/analytics/SubscriptionAnalytics.tsx`
- **Description**: Dedicated component for subscription analytics visualization.
- **Features**:
  - Revenue statistics (total, monthly, growth)
  - Subscription counts (active, pending cancellations)
  - Revenue trend visualization with line chart
  - Plan distribution visualization with pie chart
  - Revenue by plan visualization with bar chart

## Data Flow

1. User navigates to the Analytics Dashboard
2. Dashboard component loads and fetches session data to get organization ID
3. Dashboard makes parallel API calls to fetch different types of analytics data
4. Data is processed and displayed in various charts and statistics cards
5. User can switch between different analytics views using tabs
6. User can refresh data using the refresh button

## Security Considerations

- All API endpoints require authentication via NextAuth session
- Organization-specific data is protected by checking user's access to the organization
- API responses are properly error-handled to prevent data leakage

## Future Enhancements

- **Advanced Filtering**: Add date range filters for analytics data
- **Export Functionality**: Allow exporting analytics data in CSV/PDF formats
- **Custom Dashboards**: Enable users to create custom analytics dashboards
- **Real-time Analytics**: Implement WebSocket for real-time analytics updates
- **Predictive Analytics**: Add AI-powered forecasting for subscription trends

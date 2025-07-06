# Email Queue System with Product Recommendations

## Overview

The Email Queue System with Product Recommendations is an AI-powered feature that processes emails in a queue and enriches them with relevant product recommendations. This system integrates the existing email queue infrastructure with the product recommendation service to provide personalized product suggestions based on email content and contact history.

## Architecture

The system consists of the following components:

1. **Enhanced Email Queue Service**: Extends the base email queue service with product recommendation capabilities.
2. **Enhanced Email Queue Worker**: Processes emails in the queue and includes product recommendations in the results.
3. **API Routes**: Endpoints for processing emails with recommendations.
4. **UI Components**: User interface for managing the email queue and viewing recommendations.
5. **Product Recommendation Service**: Core service for generating product recommendations.

## Implementation Details

### Enhanced Email Queue Service

The enhanced email queue service (`emailQueueServiceWithRecommendations.ts`) extends the base email queue service with product recommendation capabilities. It processes emails in the queue and enriches them with product recommendations based on email content and contact history.

Key functions:

- `processQueuedEmailWithRecommendations`: Processes an email in the queue and adds product recommendations.
- `getPersonalizedRecommendations`: Gets personalized product recommendations for a contact.
- `getFrequentlyBoughtTogether`: Gets products frequently bought together with a specified product.

### Enhanced Email Queue Worker

The enhanced email queue worker (`emailQueueWorkerWithRecommendations.ts`) processes emails in the queue using the enhanced service. It handles batch processing and provides detailed statistics on processing results.

Key functions:

- `processEmailQueueWithRecommendations`: Processes a batch of emails in the queue with product recommendations.

### API Routes

The system provides the following API endpoints:

- `POST /api/email-queue/process-with-recommendations`: Processes a batch of emails in the queue with product recommendations.

### UI Components

The `EmailQueueManager` component provides a user interface for managing the email queue. It allows users to view, process, and manage emails in the queue, including those with product recommendations.

## Integration with Product Recommendation Service

The system integrates with the `ProductRecommendationService` to generate product recommendations based on email content and contact history. The service provides the following recommendation types:

1. **Email Content-Based Recommendations**: Recommendations based on the content of the email.
2. **Contact History-Based Recommendations**: Recommendations based on the contact's purchase history.
3. **Frequently Bought Together Recommendations**: Recommendations based on products frequently bought together.

## Testing

The system includes comprehensive testing tools:

1. **Test Script**: `test-email-queue-with-recommendations.js` verifies the end-to-end functionality of the email queue system with product recommendations.
2. **Shell Script Runner**: `run-email-queue-with-recommendations-test.sh` provides an easy way to run the test script.
3. **Sample .env File**: `sample.env` provides a template for configuring the test environment.

## Usage

### Processing Emails with Recommendations

To process emails in the queue with product recommendations, use the `EmailQueueManager` component or call the API endpoint directly:

```javascript
const response = await fetch('/api/email-queue/process-with-recommendations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    batchSize: 5,
  }),
});

const result = await response.json();
console.log(`Processed ${result.processed} emails with ${result.withRecommendations} recommendations`);
```

### Running Tests

To run the end-to-end test:

1. Copy `sample.env` to `.env` in the `tests/email-queue` directory.
2. Edit the `.env` file with your actual values.
3. Run the test script using the shell script runner:

```bash
./run-email-queue-with-recommendations-test.sh
```

## Future Enhancements

1. **Advanced Recommendation Algorithms**: Implement more sophisticated recommendation algorithms using machine learning.
2. **Real-time Recommendations**: Provide real-time recommendations during email composition.
3. **A/B Testing**: Implement A/B testing for different recommendation strategies.
4. **Recommendation Analytics**: Track and analyze recommendation performance.
5. **Multi-tenant Support**: Enhance the system to support multiple organizations with isolated recommendations.

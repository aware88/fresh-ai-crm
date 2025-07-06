# Product Recommendation System Documentation

## Overview

The Product Recommendation System is an AI-powered feature that provides personalized product recommendations to customers based on various data points including email content, purchase history, and browsing behavior. This system is integrated with the AI email response workflow to enhance customer communications with relevant product suggestions.

## Components

### 1. Product Recommendation Service

The core service that handles all recommendation logic. It provides several recommendation types:

- **Basic Recommendations**: General product recommendations based on popularity and availability
- **Query-Based Recommendations**: Products matching specific search terms or criteria
- **Email-Based Recommendations**: Products extracted from email content analysis
- **Frequently Bought Together**: Products commonly purchased with a specific product
- **Personalized Recommendations**: Products tailored to a specific contact based on their history

### 2. Email Context Builder with Recommendations

An enhanced version of the email context builder that integrates product recommendations into the AI email processing workflow. This component:

- Analyzes email content for product mentions
- Fetches relevant product recommendations
- Includes recommendations in the AI context
- Provides instructions to the AI on how to incorporate recommendations

### 3. API Endpoints

RESTful API endpoints for accessing the recommendation functionality:

- `GET /api/product-recommendations`: Get basic or query-based recommendations
- `POST /api/product-recommendations`: Get recommendations based on email content
- `GET /api/product-recommendations/frequently-bought`: Get frequently bought together products
- `GET /api/product-recommendations/personalized`: Get personalized recommendations for a contact
- `GET /api/emails/{id}/context`: Get email context with integrated recommendations

## Integration with Metakocka

The Product Recommendation System integrates with Metakocka ERP data to enhance recommendations with:

- Real-time inventory data
- Pricing information
- Product availability
- Order history
- Purchase patterns

## AI Context Integration

The system enhances AI email processing by:

1. **Contextual Understanding**: Providing the AI with relevant product information based on email content
2. **Personalized Suggestions**: Including products tailored to the contact's preferences and history
3. **Inventory Awareness**: Ensuring recommendations consider current stock levels
4. **Dynamic Instructions**: Adjusting AI behavior based on recommendation quality and relevance

## Testing

A comprehensive testing framework is provided to validate the recommendation system:

1. **Test Script**: `test-product-recommendations.js` tests all recommendation types and their integration with the email context
2. **Shell Runner**: `run-product-recommendations-test.sh` provides an easy way to execute tests with proper environment variables
3. **Sample Environment**: `product-recommendations-test.env.sample` shows required configuration for testing

### Running Tests

```bash
cd tests/product-recommendations
cp product-recommendations-test.env.sample .env
# Update the .env file with your test data
chmod +x run-product-recommendations-test.sh
./run-product-recommendations-test.sh
```

## Best Practices

1. **Relevance First**: Always prioritize relevance over quantity in recommendations
2. **Context Awareness**: Consider the email's intent and tone when including recommendations
3. **Inventory Check**: Only recommend products that are currently available
4. **Privacy Respect**: Ensure personalized recommendations comply with privacy policies
5. **Performance Optimization**: Cache recommendation results when appropriate to improve response times

## Future Enhancements

1. **Machine Learning Models**: Implement ML models to improve recommendation accuracy
2. **A/B Testing Framework**: Test different recommendation strategies
3. **Seasonal Adjustments**: Adjust recommendations based on seasonal trends
4. **Cross-Selling Logic**: Enhance frequently bought together algorithms
5. **Recommendation Feedback Loop**: Track which recommendations lead to conversions

## Troubleshooting

### Common Issues

1. **No Recommendations**: Check if the product catalog is properly populated and indexed
2. **Irrelevant Recommendations**: Review the email content analysis and adjust the relevance algorithms
3. **Missing Inventory Data**: Verify the Metakocka integration is working correctly
4. **Performance Issues**: Check caching mechanisms and optimize database queries

### Logging

The recommendation system logs detailed information about its operations. Key log entries to monitor:

- Recommendation generation events
- Email content analysis results
- Integration with Metakocka data
- Performance metrics for recommendation algorithms

## Conclusion

The Product Recommendation System enhances the CRM's AI capabilities by providing intelligent, contextual product suggestions that improve customer communications and drive sales opportunities. By integrating with Metakocka ERP data and the email processing workflow, it creates a seamless experience that leverages all available data to provide the most relevant recommendations.

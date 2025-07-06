# Product Recommendation System for CRM Mind

## Overview

The Product Recommendation System is a key feature of CRM Mind that provides intelligent product suggestions to enhance customer communications. By leveraging AI and data from the Metakocka ERP system, it delivers personalized recommendations based on email content, customer history, and product relationships.

## Key Features

- **Email-Based Recommendations**: Analyzes email content to suggest relevant products
- **Frequently Bought Together**: Recommends products commonly purchased together
- **Personalized Recommendations**: Tailors suggestions based on customer purchase history
- **Metakocka Integration**: Uses real-time inventory and pricing data from Metakocka
- **AI Context Integration**: Seamlessly incorporates recommendations into AI email responses

## Components

### 1. Core Service

The `ProductRecommendationService` class (`src/services/product-recommendation.ts`) provides the core recommendation functionality:

- Basic product recommendations
- Query-based recommendations
- Email content analysis for recommendations
- Frequently bought together products
- Personalized recommendations

### 2. API Routes

The following API endpoints are available:

- `GET /api/product-recommendations`: Get basic or query-based recommendations
- `POST /api/product-recommendations`: Get recommendations based on email content
- `GET /api/product-recommendations/frequently-bought`: Get frequently bought together products
- `GET /api/product-recommendations/personalized`: Get personalized recommendations
- `GET /api/emails/[id]/context`: Get email context with integrated recommendations

### 3. Email Context Integration

The enhanced email context builder (`src/lib/ai/email-context-builder-with-recommendations.ts`) integrates product recommendations into the AI email processing workflow.

## Testing

A comprehensive testing framework is provided in the `tests/product-recommendations` directory:

- `test-product-recommendations.js`: Tests all recommendation types and their integration
- `run-product-recommendations-test.sh`: Shell script for running tests
- `product-recommendations-test.env.sample`: Sample environment configuration

### Running Tests

```bash
cd tests/product-recommendations
cp product-recommendations-test.env.sample .env
# Update the .env file with your test data
chmod +x run-product-recommendations-test.sh
./run-product-recommendations-test.sh
```

## Documentation

Detailed documentation is available in `docs/product-recommendation-system.md`.

## Integration with Metakocka

The Product Recommendation System integrates with the Metakocka ERP system to enhance recommendations with:

- Real-time inventory data
- Pricing information
- Product availability
- Order history
- Purchase patterns

## Future Enhancements

1. **Machine Learning Models**: Implement ML models to improve recommendation accuracy
2. **A/B Testing Framework**: Test different recommendation strategies
3. **Seasonal Adjustments**: Adjust recommendations based on seasonal trends
4. **Cross-Selling Logic**: Enhance frequently bought together algorithms
5. **Recommendation Feedback Loop**: Track which recommendations lead to conversions

## Conclusion

The Product Recommendation System enhances the CRM's AI capabilities by providing intelligent, contextual product suggestions that improve customer communications and drive sales opportunities. By integrating with Metakocka ERP data and the email processing workflow, it creates a seamless experience that leverages all available data to provide the most relevant recommendations.

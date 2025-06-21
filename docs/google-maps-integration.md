# Google Maps API Integration Guide

This guide explains how to set up Google Maps API integration for the enhanced dining agent, which provides real-time restaurant data and LLM-powered enhancements.

## 🚀 Features Overview

### Google Maps API Integration
- **Real-time restaurant search** using Google Maps Places API
- **Detailed restaurant information** including hours, reviews, and contact details
- **Price level mapping** from Google's 0-4 scale to user-friendly $ symbols
- **Automatic cuisine detection** using restaurant metadata
- **Feature extraction** (takeaway, delivery, parking, accessibility)

### LLM-Powered Enhancements
- **Natural language preference extraction** from user messages
- **Restaurant description generation** based on API data and reviews
- **Menu highlights prediction** using cuisine type and restaurant info
- **Review summarization** for quick insights
- **Intelligent cuisine type detection** when not explicitly provided

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Maps Platform API key** with appropriate permissions
3. **OpenAI API key** for LLM functionality
4. **Node.js environment** with required packages installed

## 🔧 Setup Instructions

### Step 1: Enable Google Maps APIs

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API** (for restaurant search)
   - **Places API (New)** (for detailed place information)
   - **Geocoding API** (optional, for location processing)

### Step 2: Create API Key

1. Go to **Credentials** in the Google Cloud Console
2. Click **Create Credentials** → **API Key**
3. Copy the generated API key
4. **Important**: Restrict the API key:
   - Go to **API restrictions** → Select the APIs you enabled
   - Go to **Application restrictions** → Set up domain/IP restrictions if needed

### Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Required: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Required for real data: Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: Node environment
NODE_ENV=development
```

### Step 4: Install Dependencies

The required packages should already be installed, but verify:

```bash
pnpm install @googlemaps/google-maps-services-js @ai-sdk/openai ai axios dotenv
```

## 🎯 Usage Examples

### Basic Restaurant Search
```typescript
const response = await diningAgent.generate([
  { role: 'user', content: 'Find Italian restaurants in San Francisco' }
]);
```

### Natural Language Processing
```typescript
const response = await diningAgent.generate([
  { role: 'user', content: 'I want something spicy and vegetarian for dinner, not too expensive' }
]);
```

### Restaurant Details
```typescript
const response = await diningAgent.generate([
  { role: 'user', content: 'Tell me about Bella Vista Italian restaurant in downtown' }
]);
```

### Memory-Powered Personalization
```typescript
// Store preferences
await diningAgent.generate([
  { role: 'user', content: 'I love Thai food and I\'m gluten-free' }
], {
  memory: {
    thread: 'user-profile-123',
    resource: 'user-456'
  }
});

// Get personalized recommendations
await diningAgent.generate([
  { role: 'user', content: 'Recommend restaurants in Chicago' }
], {
  memory: {
    thread: 'user-profile-123',
    resource: 'user-456'
  }
});
```

## 🛠️ Technical Implementation

### Google Maps API Integration

The dining agent uses three main API endpoints:

1. **Text Search API** (`/textsearch/json`)
   - Searches for restaurants by query
   - Returns basic information and place IDs

2. **Place Details API** (`/details/json`)
   - Gets comprehensive restaurant information
   - Requires place ID from search results

3. **Places API Fields**
   - `name`, `formatted_address`, `formatted_phone_number`
   - `website`, `rating`, `price_level`
   - `opening_hours`, `reviews`, `types`

### LLM Enhancement Pipeline

1. **Raw Data Collection**: Fetch from Google Maps API
2. **LLM Processing**: Enhance with OpenAI GPT-4o-mini
3. **Structured Output**: Convert to agent-friendly format
4. **Fallback Handling**: Use defaults if LLM fails

### Error Handling Strategy

- **API Key Missing**: Gracefully fall back to mock data
- **Rate Limiting**: Implement exponential backoff (future enhancement)
- **Invalid Responses**: Use default enhancement functions
- **Network Errors**: Return cached/mock data with user notification

## 💰 Cost Optimization

### Google Maps API Pricing (as of 2024)
- **Text Search**: $32 per 1000 requests
- **Place Details**: $17 per 1000 requests
- **Monthly Credits**: $200 free tier

### OpenAI API Pricing
- **GPT-4o-mini**: $0.00015 per 1k input tokens, $0.0006 per 1k output tokens
- **Typical Enhancement**: ~200 tokens per restaurant (~$0.0001 per enhancement)

### Cost-Saving Tips
1. **Cache Results**: Store restaurant data locally for repeated queries
2. **Batch Requests**: Process multiple restaurants in single LLM calls
3. **Smart Filtering**: Apply local filters before API calls
4. **Rate Limiting**: Implement user-based request limits

## 🔒 Security Best Practices

### API Key Security
```bash
# ✅ Good - Environment variable
GOOGLE_MAPS_API_KEY=your_key_here

# ❌ Bad - Hardcoded in source
const apiKey = "AIzaSyC-your-actual-key";
```

### API Key Restrictions
1. **Application restrictions**: Limit to your domain/IP
2. **API restrictions**: Only enable required APIs
3. **Quota limits**: Set daily usage limits
4. **Monitoring**: Enable API usage alerts

### Environment Management
- Use different API keys for development/production
- Implement proper secret management in production
- Regular key rotation policy
- Monitor for unauthorized usage

## 📊 Monitoring & Analytics

### Key Metrics to Track
- **API Call Volume**: Monitor daily/monthly usage
- **Response Times**: Track API latency
- **Error Rates**: Monitor failed requests
- **Cost Tracking**: Daily spend on APIs
- **User Satisfaction**: Restaurant recommendation accuracy

### Logging Implementation
```typescript
console.log(`API Call: ${endpoint}, Response: ${status}, Latency: ${time}ms`);
```

## 🚨 Troubleshooting

### Common Issues

1. **"API key not found" errors**
   - Check `.env` file exists and is properly formatted
   - Verify environment variable loading
   - Ensure API key is not quoted incorrectly

2. **"API not enabled" errors**
   - Enable Places API in Google Cloud Console
   - Wait 5-10 minutes for propagation
   - Check API restrictions

3. **"Quota exceeded" errors**
   - Check Google Cloud Console quota page
   - Implement rate limiting in application
   - Consider upgrading billing plan

4. **LLM enhancement fails**
   - Check OpenAI API key and quota
   - Verify network connectivity
   - Review prompt format and length

### Debug Mode

Enable detailed logging:
```typescript
// In src/mastra/index.ts
logger: new PinoLogger({
  name: 'Mastra',
  level: 'debug',
})
```

### Testing Without API Key

The agent gracefully falls back to mock data when the Google Maps API key is not provided, allowing development and testing without API costs.

## 🔄 Future Enhancements

- **Caching Layer**: Redis/memory cache for repeated queries
- **Rate Limiting**: Per-user request limits
- **Bulk Operations**: Process multiple restaurants efficiently
- **Real-time Updates**: Webhook integration for restaurant changes
- **Advanced Filtering**: More sophisticated search criteria
- **Photo Integration**: Restaurant images from Google Photos API
- **Multi-language Support**: Cuisine names and descriptions in multiple languages 
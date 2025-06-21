# Dining Agent Guide

The Dining Agent is a specialized AI assistant built with Mastra that helps users discover restaurants and get personalized dining recommendations. It uses Google Maps API integration (simulated for development) to provide comprehensive restaurant information.

## Features

### 🔍 Restaurant Search
- Find restaurants by location, cuisine type, price range, and ratings
- Filter results based on specific criteria
- Get up to 20 restaurant recommendations per search

### 🏪 Detailed Restaurant Information
- Get comprehensive details about specific restaurants
- View operating hours, menu highlights, and customer reviews
- Access contact information and reservation details
- See restaurant features (outdoor seating, parking, etc.)

### 🧠 Memory & Personalization
- Remembers user preferences across conversations
- Provides personalized recommendations based on past interactions
- Stores dietary restrictions and cuisine preferences

## Available Tools

### 1. Dining Search Tool (`diningTool`)
Searches for restaurants based on location and filters.

**Parameters:**
- `location` (required): City or area to search
- `cuisine` (optional): Type of cuisine (Italian, Chinese, Mexican, etc.)
- `priceRange` (optional): Price range ($, $$, $$$, $$$$)
- `rating` (optional): Minimum rating (1-5 stars)
- `limit` (optional): Number of results (max 20, default 10)

### 2. Restaurant Details Tool (`restaurantDetailsTool`)
Gets detailed information about a specific restaurant.

**Parameters:**
- `restaurantName` (required): Name of the restaurant
- `location` (required): City or area where the restaurant is located

## Usage Examples

### Basic Restaurant Search
```typescript
const response = await diningAgent.generate([
  { role: 'user', content: 'I\'m looking for restaurants in New York' }
]);
```

### Cuisine-Specific Search
```typescript
const response = await diningAgent.generate([
  { role: 'user', content: 'Find me Italian restaurants in San Francisco with good ratings' }
]);
```

### Budget-Friendly Search
```typescript
const response = await diningAgent.generate([
  { role: 'user', content: 'I need cheap restaurants in Los Angeles, preferably under $$ price range' }
]);
```

### Using Memory for Personalization
```typescript
// Set user preferences
const response1 = await diningAgent.generate([
  { role: 'user', content: 'I love spicy food and prefer Asian cuisine' }
], {
  memory: {
    thread: 'user-preferences-123',
    resource: 'user-456'
  }
});

// Get personalized recommendations
const response2 = await diningAgent.generate([
  { role: 'user', content: 'Can you recommend restaurants in Chicago based on my preferences?' }
], {
  memory: {
    thread: 'user-preferences-123',
    resource: 'user-456'
  }
});
```

### Getting Detailed Restaurant Information
```typescript
const response = await diningAgent.generate([
  { role: 'user', content: 'Tell me more about Bella Vista Italian restaurant in downtown' }
]);
```

## Running the Agent

### 1. Start the Mastra Development Server
```bash
pnpm mastra dev
```

### 2. Test the Agent
Run the test file to see the agent in action:
```bash
npx tsx src/test-dining-agent.ts
```

### 3. API Endpoint
The agent is available at:
```
POST http://localhost:4111/api/agents/diningAgent/generate
```

Example API request:
```bash
curl -X POST http://localhost:4111/api/agents/diningAgent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Find me Italian restaurants in San Francisco" }
    ]
  }'
```

## Integration with Real APIs

The current implementation uses mock data for development. To integrate with real APIs:

### Google Maps Places API
1. Get a Google Maps API key
2. Install the Google Maps client library
3. Update the `diningTool` to make real API calls:

```typescript
// In dining-tool.ts, replace the mock data with:
const response = await fetch(
  `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${cuisine}+restaurants+in+${location}&key=${API_KEY}`
);
```

### Other Restaurant APIs
- **Yelp Fusion API**: For reviews and ratings
- **OpenTable API**: For reservation availability
- **Foursquare Places API**: For venue details and tips

## Configuration

The dining agent is configured in `src/mastra/agents/dining-agent.ts` with:

- **Model**: OpenAI GPT-4o-mini for fast, cost-effective responses
- **Memory**: LibSQL storage for persistent user preferences
- **Tools**: Two specialized tools for restaurant search and details
- **Instructions**: Comprehensive prompts for natural conversation

## Memory Storage

User preferences and conversation history are stored using:
- **Storage**: LibSQL database (`../mastra.db`)
- **Thread Management**: Unique thread IDs for conversation continuity
- **Resource Identification**: User-specific resource IDs for personalization

## Best Practices

1. **Always provide location**: The agent works best when users specify a city or area
2. **Use memory for personalization**: Implement thread and resource IDs for returning users
3. **Handle edge cases**: The agent gracefully handles missing information and suggests alternatives
4. **Leverage both tools**: Use search for discovery and details for specific information
5. **Monitor API usage**: In production, implement rate limiting and caching for external APIs

## Troubleshooting

### Common Issues

1. **Agent not found**: Ensure the dining agent is registered in `src/mastra/index.ts`
2. **Memory not working**: Check that LibSQL storage is properly configured
3. **Tools not executing**: Verify tool imports and registration in the agent configuration
4. **API rate limits**: Implement caching and rate limiting for production use

### Debug Mode

Enable debug logging by setting the logger level:
```typescript
logger: new PinoLogger({
  name: 'Mastra',
  level: 'debug',
})
```

## Future Enhancements

- Real-time availability checking
- Integration with reservation systems
- Multi-language support
- Image recognition for menu items
- Location-based recommendations using GPS
- Social media integration for reviews
- Dietary restriction filtering
- Group dining coordination 
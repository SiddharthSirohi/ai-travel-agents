import { mastra } from './mastra';

async function testDiningAgent() {
  const diningAgent = mastra.getAgent('diningAgent');

  console.log('🍽️  Testing Enhanced Dining Agent with Google Maps API & LLM\n');
  console.log('Note: Set GOOGLE_MAPS_API_KEY environment variable for real API calls, otherwise mock data will be used.\n');

  // Test 1: Natural language preference extraction
  console.log('Test 1: Natural language preference extraction');
  const response1 = await diningAgent.generate([
    { role: 'user', content: 'I\'m craving something spicy for dinner tonight, maybe Asian food. I\'m vegetarian and want something not too expensive in San Francisco' }
  ]);
  console.log('Agent:', response1.text);
  console.log('\n-------------------\n');

  // Test 2: Complex dining request with multiple criteria
  console.log('Test 2: Complex dining request with Google Maps integration');
  const response2 = await diningAgent.generate([
    { role: 'user', content: 'Find me highly-rated Italian restaurants in New York that have outdoor seating and are good for a romantic dinner' }
  ]);
  console.log('Agent:', response2.text);
  console.log('\n-------------------\n');

  // Test 3: Specific restaurant details with LLM enhancement
  console.log('Test 3: Getting detailed restaurant information');
  const response3 = await diningAgent.generate([
    { role: 'user', content: 'Tell me everything about Bella Vista Italian restaurant in downtown San Francisco - hours, menu highlights, reviews, and how to make a reservation' }
  ]);
  console.log('Agent:', response3.text);
  console.log('\n-------------------\n');

  // Test 4: Budget-conscious request with dietary restrictions
  console.log('Test 4: Budget-conscious request with dietary restrictions');
  const response4 = await diningAgent.generate([
    { role: 'user', content: 'I need cheap vegan restaurants in Los Angeles for lunch tomorrow. I\'m bringing 4 friends and we want something casual' }
  ]);
  console.log('Agent:', response4.text);
  console.log('\n-------------------\n');

  // Test 5: Memory-powered personalization
  console.log('Test 5: Setting up user preferences with memory');
  const response5 = await diningAgent.generate([
    { role: 'user', content: 'I love spicy Thai food, I\'m gluten-free, and I prefer mid-range restaurants around $20-30 per person. I also like places with good ambiance for dates' }
  ], {
    memory: {
      thread: 'user-dining-profile-123',
      resource: 'user-456'
    }
  });
  console.log('Agent:', response5.text);

  // Follow-up request using stored preferences
  console.log('\nTest 5b: Using stored preferences for personalized recommendations');
  const response6 = await diningAgent.generate([
    { role: 'user', content: 'I\'m planning a date in Chicago this weekend. Can you recommend some restaurants based on what you know about my preferences?' }
  ], {
    memory: {
      thread: 'user-dining-profile-123',
      resource: 'user-456'
    }
  });
  console.log('Agent:', response6.text);
  console.log('\n-------------------\n');

  // Test 6: Ambiguous request that requires preference extraction
  console.log('Test 6: Handling ambiguous dining requests');
  const response7 = await diningAgent.generate([
    { role: 'user', content: 'I want to grab a bite somewhere nice but not fancy, you know? Something with good vibes and decent food in Miami' }
  ]);
  console.log('Agent:', response7.text);
  console.log('\n-------------------\n');

  // Test 7: Special occasion planning
  console.log('Test 7: Special occasion restaurant planning');
  const response8 = await diningAgent.generate([
    { role: 'user', content: 'It\'s my anniversary next week and I want to surprise my partner with an amazing dinner in Seattle. Money is no object, I want the best!' }
  ]);
  console.log('Agent:', response8.text);
  console.log('\n-------------------\n');

  console.log('✅ Enhanced Dining Agent tests completed!');
  console.log('\n🔧 Features demonstrated:');
  console.log('- Natural language preference extraction using LLM');
  console.log('- Google Maps API integration for real restaurant data');
  console.log('- LLM-enhanced restaurant descriptions and menu highlights');
  console.log('- Memory-powered personalization and preference storage');
  console.log('- Complex query understanding and structured search');
  console.log('- Fallback to mock data when API is unavailable');
  console.log('- Dietary restriction and budget-conscious filtering');
  console.log('- Special occasion and ambiance-based recommendations');
}

// Helper function to test individual tools
async function testIndividualTools() {
  console.log('\n🛠️  Testing Individual Tools\n');
  
  const diningAgent = mastra.getAgent('diningAgent');
  
  // Test cuisine extraction tool directly
  console.log('Testing Cuisine Extraction Tool:');
  const extractionTest = await diningAgent.generate([
    { role: 'user', content: 'Use the cuisine extraction tool to analyze this message: "I want sushi or ramen for lunch with my coworkers, somewhere casual and not too pricey in downtown"' }
  ]);
  console.log('Extraction Result:', extractionTest.text);
  console.log('\n-------------------\n');
  
  // Test dining search with specific parameters
  console.log('Testing Dining Search Tool:');
  const searchTest = await diningAgent.generate([
    { role: 'user', content: 'Use the dining search tool to find Italian restaurants in San Francisco with rating above 4.0 and price range $$$' }
  ]);
  console.log('Search Result:', searchTest.text);
  console.log('\n-------------------\n');
}

// Run the tests
async function runAllTests() {
  try {
    await testDiningAgent();
    await testIndividualTools();
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Check if running directly
if (require.main === module) {
  runAllTests();
}

export { testDiningAgent, testIndividualTools }; 
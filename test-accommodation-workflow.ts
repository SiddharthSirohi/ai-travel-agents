import { accommodationWorkflow } from './src/mastra/workflows/accommodation-workflow';

async function testAccommodationWorkflow() {
  console.log('🏨 Testing Accommodation Workflow...\n');

  const testData = {
    city: 'New York',
    waypoints: [
      {
        location: 'Manhattan',
        date: '2025-03-15',
        objective: 'Business meetings and sightseeing'
      },
      {
        location: 'Manhattan', 
        date: '2025-03-16',
        objective: 'Broadway show and dining'
      },
      {
        location: 'Brooklyn',
        date: '2025-03-17',
        objective: 'Art galleries and local culture'
      }
    ],
    budgetTier: 'mid-range' as const,
    accommodationType: 'hotel' as const,
    limit: 5
  };

  try {
    console.log('Input data:', JSON.stringify(testData, null, 2));
    console.log('\n🔄 Running accommodation workflow...\n');

    const run = await accommodationWorkflow.createRun();
    const workflowResult = await run.start({
      inputData: testData,
    });

    if (workflowResult.status === 'failed') {
      throw new Error(`Workflow failed: ${workflowResult.error.message}`);
    } else if (workflowResult.status === 'suspended') {
      throw new Error('Workflow was suspended unexpectedly');
    }

    const result = workflowResult.result;

    console.log('✅ Accommodation Workflow Result:');
    console.log('Merged Waypoints:', result.mergedWaypoints);
    console.log('Search Query:', result.query);
    console.log('Total Found:', result.totalFound);
    console.log('\nAccommodations:');
    result.accommodations.forEach((accommodation, index) => {
      console.log(`\n${index + 1}. ${accommodation.name}`);
      console.log(`   Type: ${accommodation.type}`);
      console.log(`   Rating: ${accommodation.rating}/5`);
      console.log(`   Price Range: ${accommodation.priceRange}`);
      console.log(`   Stay: ${accommodation.from} to ${accommodation.to}`);
      console.log(`   Location: ${accommodation.location}`);
      console.log(`   Address: ${accommodation.hotel_info.address}`);
      console.log(`   Amenities: ${accommodation.hotel_info.amenities?.join(', ') || 'N/A'}`);
      console.log(`   Description: ${accommodation.hotel_info.description || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error testing accommodation workflow:', error);
  }
}

// Run the test
testAccommodationWorkflow()
  .then(() => console.log('\n✅ Test completed'))
  .catch(console.error); 
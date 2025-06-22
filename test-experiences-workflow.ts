import 'dotenv/config';
import { mastra } from './src/mastra';

async function testExperiencesWorkflow() {
  console.log('🎯 Testing Experiences Workflow...\n');

  // Sample waypoints for a 1-day trip to Paris for faster testing
  const sampleWaypoints = [
    {
      location: 'Paris, France',
      date: '2025-04-15',
      objective: 'cultural exploration'
    }
  ];

  const inputData = {
    waypoints: sampleWaypoints,
    budgetRange: '$$' as const,
    travellerCount: 2,
    travelStyle: 'cultural'
  };

  try {
    console.log('📍 Input data:');
    console.log(JSON.stringify(inputData, null, 2));
    console.log('\n🚀 Starting experiences workflow...\n');

    const workflow = mastra.getWorkflow('experiences-workflow');
    const run = workflow.createRun();

    const result = await run.start({
      inputData
    });

    console.log('✅ Experiences Workflow completed successfully!');
    console.log('\n📋 Results:');
    console.log('='.repeat(60));
    
    if (result.status === 'success' && result.result) {
      const { experiences, totalFound } = result.result;
      
      console.log(`\n🎉 Found ${totalFound} experiences across ${experiences.length} days:\n`);
      
      experiences.forEach((dayExp, index) => {
        console.log(`📅 Day ${index + 1} - ${dayExp.date}:`);
        console.log('  🌅 MORNING EXPERIENCE:');
        console.log(`    📌 Name: ${dayExp.morningExperience.name}`);
        console.log(`    🕘 Time: ${dayExp.morningExperience.startTime} - ${dayExp.morningExperience.endTime}`);
        if (dayExp.morningExperience.imageUrl) {
          console.log(`    🖼️  Image: ${dayExp.morningExperience.imageUrl}`);
        }
        if (dayExp.morningExperience.locationLatitude && dayExp.morningExperience.locationLongitude) {
          console.log(`    📍 Coordinates: ${dayExp.morningExperience.locationLatitude}, ${dayExp.morningExperience.locationLongitude}`);
        } else {
          console.log(`    ❌ Missing coordinates!`);
        }
        if (dayExp.morningExperience.urlLink) {
          console.log(`    🔗 URL: ${dayExp.morningExperience.urlLink}`);
        }
        
        console.log('  🌇 AFTERNOON EXPERIENCE:');
        console.log(`    📌 Name: ${dayExp.afternoonExperience.name}`);
        console.log(`    🕐 Time: ${dayExp.afternoonExperience.startTime} - ${dayExp.afternoonExperience.endTime}`);
        if (dayExp.afternoonExperience.imageUrl) {
          console.log(`    🖼️  Image: ${dayExp.afternoonExperience.imageUrl}`);
        }
        if (dayExp.afternoonExperience.locationLatitude && dayExp.afternoonExperience.locationLongitude) {
          console.log(`    📍 Coordinates: ${dayExp.afternoonExperience.locationLatitude}, ${dayExp.afternoonExperience.locationLongitude}`);
        } else {
          console.log(`    ❌ Missing coordinates!`);
        }
        if (dayExp.afternoonExperience.urlLink) {
          console.log(`    🔗 URL: ${dayExp.afternoonExperience.urlLink}`);
        }
        console.log('  ' + '-'.repeat(50));
      });

      // Show final JSON output for verification
      console.log('\n🔍 Final JSON Output (for further use):');
      console.log(JSON.stringify(result.result, null, 2));

    } else {
      console.log('❌ Workflow failed or returned no results');
      console.log('Status:', result.status);
      if (result.error) {
        console.log('Error:', result.error);
      }
    }

  } catch (error) {
    console.error('💥 Error running experiences workflow:', error);
  }
}

// Run the test
testExperiencesWorkflow().catch(console.error); 
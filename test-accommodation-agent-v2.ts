import { accommodationAgentV2 } from './src/mastra/agents/accommodation-agent-v2';

async function testAccommodationAgentV2() {
    console.log('🏨 Testing Accommodation Agent V2 with Booking.com scraper...\n');

    try {
        // Test 1: Mumbai search
        console.log('📍 Test 1: Searching for hotels in Mumbai...');
        const mumbaiResponse = await accommodationAgentV2.stream([
            {
                role: 'user',
                content: 'Find me hotels in Mumbai, India for 2 adults from December 20-22, 2025. I need 1 room.'
            }
        ]);

        console.log('Mumbai Result:');
        let mumbaiResult = '';
        for await (const chunk of mumbaiResponse.textStream) {
            process.stdout.write(chunk);
            mumbaiResult += chunk;
        }

        console.log('\n\n---- Parsed Mumbai JSON ----');
        try {
            console.log(JSON.parse(mumbaiResult));
        } catch (e) {
            console.log('Raw response:', mumbaiResult);
        }

        console.log('\n' + '='.repeat(80) + '\n');

        // Test 2: Delhi search with children
        console.log('📍 Test 2: Searching for hotels in Delhi with children...');
        const delhiResponse = await accommodationAgentV2.stream([
            {
                role: 'user',
                content: 'I need accommodation in New Delhi for a family: 2 adults and 1 child, staying from October 15-17, 2025. We need 1 room.'
            }
        ]);

        console.log('Delhi Result:');
        let delhiResult = '';
        for await (const chunk of delhiResponse.textStream) {
            process.stdout.write(chunk);
            delhiResult += chunk;
        }

        console.log('\n\n---- Parsed Delhi JSON ----');
        try {
            console.log(JSON.parse(delhiResult));
        } catch (e) {
            console.log('Raw response:', delhiResult);
        }

    } catch (error) {
        console.error('❌ Error testing accommodation agent v2:', error);
    }
}

testAccommodationAgentV2(); 
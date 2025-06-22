import { searchAirbnb, SearchParams, Listing } from './airbnb_scraper_v2';

async function testScraper() {
    console.log('🏠 Testing Airbnb Scraper Programmatically\n');

    try {
        // Example 1: Search for accommodations in Goa
        console.log('📍 Searching in Goa...');
        const goaListings = await searchAirbnb(
            'Goa',
            'Goa',
            '2025-11-15',
            '2025-11-17',
            2,
            0,
            5 // Only get 5 listings
        );

        console.log(`✅ Found ${goaListings.length} listings in Goa:`);
        goaListings.forEach((listing, index) => {
            console.log(`${index + 1}. ${listing.name} - ₹${listing.price}`);
        });

        console.log('\n' + '='.repeat(50) + '\n');

        // Example 2: Search for accommodations in Delhi
        console.log('📍 Searching in Delhi...');
        const delhiListings = await searchAirbnb(
            'New-Delhi',
            'Delhi',
            '2025-10-20',
            '2025-10-22',
            1,
            1,
            3 // Only get 3 listings
        );

        console.log(`✅ Found ${delhiListings.length} listings in Delhi:`);
        delhiListings.forEach((listing, index) => {
            console.log(`${index + 1}. ${listing.name} - ₹${listing.price}`);
        });

    } catch (error) {
        console.error('❌ Error during scraping:', error);
    }
}

// Run the test
testScraper(); 
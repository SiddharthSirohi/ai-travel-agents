import puppeteer, { Browser, Page } from 'puppeteer';

interface HotelInfo {
    name: string;
    price: string;
}

interface SearchParams {
    city: string;
    checkin: string; // YYYY-MM-DD
    checkout: string; // YYYY-MM-DD
    adults: number;
    rooms: number;
    children?: number; // Optional, defaults to 0
    childrenAges?: number[]; // Optional, e.g., [5, 10]
}

function constructBookingUrl(params: SearchParams): string {
    const baseUrl = "https://www.booking.com/searchresults.en-gb.html";
    const query = new URLSearchParams({
        ss: params.city,
        efdco: "1", // As seen in the example
        dest_type: "region", // As seen in the example, could also be "city"
        checkin: params.checkin,
        checkout: params.checkout,
        group_adults: params.adults.toString(),
        no_rooms: params.rooms.toString(),
        group_children: (params.children || 0).toString(),
    });

    if (params.children && params.childrenAges) {
        params.childrenAges.forEach(age => query.append('age', age.toString()));
    }
    // Add other parameters if needed, like &sb=1 or &src=searchresults

    return `${baseUrl}?${query.toString()}`;
}

async function scrapeBookingHotels(params: SearchParams): Promise<HotelInfo[]> {
    const url = constructBookingUrl(params);
    console.log(`Navigating to: ${url}`);

    const browser: Browser = await puppeteer.launch({
        headless: true, // Set to false for debugging, true for production
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page: Page = await browser.newPage();

    // Set a realistic viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const hotelData: HotelInfo[] = [];

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Attempt to close cookie consent pop-up if it appears
        try {
            const cookieButtonSelector = '#onetrust-accept-btn-handler';
            await page.waitForSelector(cookieButtonSelector, { timeout: 5000 });
            await page.click(cookieButtonSelector);
            console.log('Cookie consent banner accepted.');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Give some time for the overlay to disappear
        } catch (e) {
            console.log('Cookie consent banner not found or could not be closed.');
        }
        
        // Wait for the main results container and property cards
        const propertyCardSelector = 'div[data-testid="property-card"]';
        try {
            await page.waitForSelector(propertyCardSelector, { timeout: 30000 });
            console.log('Property cards loaded.');
        } catch (e) {
            console.error('Timeout waiting for property cards. Page might not have loaded correctly or selectors changed.');
            await page.screenshot({ path: 'error_screenshot_property_card.png' }); // Save a screenshot for debugging
            // console.log(await page.content()); // Log page content for debugging
            await browser.close();
            return [];
        }


        const cards = await page.$$(propertyCardSelector);
        
        if (cards.length === 0) {
            console.log("No hotel cards found with the selector.");
            return [];
        }

        console.log(`Found ${cards.length} property cards. Processing first 5.`);

        for (let i = 0; i < Math.min(cards.length, 5); i++) {
            const card = cards[i];
            let name = 'N/A';
            let price = 'N/A';

            try {
                const nameElement = await card.$('div[data-testid="title"]');
                if (nameElement) {
                    name = await page.evaluate(el => el.textContent?.trim() || 'N/A', nameElement);
                }
            } catch (error) {
                console.error(`Error extracting name for card ${i+1}:`, error);
            }

            try {
                const priceElement = await card.$('span[data-testid="price-and-discounted-price"]');
                if (priceElement) {
                    price = await page.evaluate(el => el.textContent?.trim() || 'N/A', priceElement);
                } else {
                    // Fallback if the primary price selector isn't found (e.g. different structure for no discount)
                    // This might need further inspection of pages where the primary selector fails
                    const altPriceElement = await card.$('div[data-testid="availability-rate-information"] span.fcab3ed991.fbd1d3018c.e729ed5ab6'); // Example of a more generic price span
                    if (altPriceElement) {
                         price = await page.evaluate(el => el.textContent?.trim() || 'N/A', altPriceElement);
                    }
                }
            } catch (error) {
                 console.error(`Error extracting price for card ${i+1}:`, error);
            }
            
            hotelData.push({ name, price });
        }

    } catch (error) {
        console.error('An error occurred during scraping:', error);
        await page.screenshot({ path: 'error_screenshot.png' });
        // console.log(await page.content()); // Log page content for debugging
    } finally {
        await browser.close();
    }

    return hotelData;
}

// --- Main execution ---
async function main() {
    // Parse command line arguments or use defaults
    const args = process.argv.slice(2);
    
    let searchParameters: SearchParams;
    
    if (args.length >= 5) {
        // Command line arguments: city checkin checkout adults rooms [children]
        searchParameters = {
            city: args[0],
            checkin: args[1],
            checkout: args[2],
            adults: parseInt(args[3]),
            rooms: parseInt(args[4]),
            children: args[5] ? parseInt(args[5]) : 0
        };
    } else {
        // Default parameters if no command line args provided
        console.log("No parameters provided. Using default search parameters.");
        console.log("Usage: node dist/bookingdotcom_scraper.js <city> <checkin> <checkout> <adults> <rooms> [children]");
        console.log("Example: node dist/bookingdotcom_scraper.js \"Mumbai, India\" 2025-06-23 2025-06-28 2 1 0");
        console.log("Date format: YYYY-MM-DD");
        console.log("\nUsing default parameters...\n");
        
        searchParameters = {
            city: "Hyderabad, India",
            checkin: "2025-06-23",
            checkout: "2025-06-28",
            adults: 2,
            rooms: 1,
            children: 0,
        };
    }

    console.log(`Starting Booking.com scraper...`);
    console.log(`Target: ${searchParameters.city}`);
    console.log(`Dates: ${searchParameters.checkin} to ${searchParameters.checkout}`);
    console.log(`Guests: ${searchParameters.adults} adults, ${searchParameters.children || 0} children`);
    console.log(`Rooms: ${searchParameters.rooms}\n`);

    const hotels = await scrapeBookingHotels(searchParameters);

    if (hotels.length > 0) {
        console.log(`\n✅ SUCCESS! Found ${hotels.length} hotels:`);
        console.log('='.repeat(50));
        hotels.forEach((hotel, index) => {
            console.log(`\n${index + 1}. ${hotel.name}`);
            console.log(`   💰 Price: ${hotel.price}`);
        });
        console.log('\n' + '='.repeat(50));
    } else {
        console.log("❌ No hotel data was scraped.");
    }
}

// Simple wrapper function for easier programmatic usage
export async function searchBookingHotels(
    city: string,
    checkin: string,
    checkout: string,
    adults: number,
    rooms: number,
    children: number = 0,
    maxResults: number = 5
): Promise<HotelInfo[]> {
    const searchParams: SearchParams = {
        city,
        checkin,
        checkout,
        adults,
        rooms,
        children
    };
    
    return await scrapeBookingHotels(searchParams);
}

// Export the main scraping function and types for use as a module
export { scrapeBookingHotels };
export type { SearchParams, HotelInfo };

// Only run main if this file is executed directly (ES module way)
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
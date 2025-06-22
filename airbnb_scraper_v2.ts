import puppeteer, { Page, ElementHandle, Browser } from 'puppeteer';

interface Listing {
    name: string;
    price: string;
    url?: string;
}

interface SearchParams {
    city: string;
    region: string;
    checkin: string;
    checkout: string;
    adults: number;
    children: number;
}

// --- UPDATED SELECTORS ---
const LISTING_CARD_SELECTOR = 'div[data-testid="card-container"]';
const TITLE_SELECTOR = 'span[data-testid="listing-card-name"]'; // This seems to hold the specific listing name

// Price can be tricky. We'll try to find the most prominent price.
// This targets the displayed price, often the discounted one, within its button.
const PRICE_BUTTON_SPAN_SELECTOR = 'div[data-testid="price-availability-row"] button span:first-child';
// Fallback if the above structure isn't found (e.g. no discount, simpler display)
const PRICE_GENERAL_SELECTOR = 'div[data-testid="price-availability-row"] span[class*="p13natt"]'; // Look for spans with price-like classes
const PRICE_QUALIFIER_SELECTOR = 'div[data-testid="price-availability-row"] .q13rtw21 > span'; // e.g., "for 2 nights" or "night"

const LINK_SELECTOR = 'a[target^="listing_"]';

// Utility function for random delays
function randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Function to simulate human-like mouse movements
async function humanLikeMouseMove(page: Page) {
    const viewport = page.viewport();
    if (!viewport) return;
    
    // Random movements
    for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * viewport.width);
        const y = Math.floor(Math.random() * viewport.height);
        await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
        await randomDelay(100, 300);
    }
}

// Function to simulate human scrolling
async function humanLikeScroll(page: Page) {
    const scrollDistance = Math.floor(Math.random() * 300) + 100;
    await page.evaluate((distance) => {
        window.scrollBy({
            top: distance,
            behavior: 'smooth'
        });
    }, scrollDistance);
    await randomDelay(500, 1500);
}

// Function to check if we're being blocked
async function checkIfBlocked(page: Page): Promise<boolean> {
    const blockedIndicators = [
        'Access denied',
        'security check',
        'verify you are human',
        'captcha',
        'unusual traffic',
        'robot'
    ];
    
    const pageContent = (await page.content()).toLowerCase();
    return blockedIndicators.some(indicator => pageContent.includes(indicator));
}

async function scrapeAirbnb(params: SearchParams, numberOfListings: number = 10): Promise<Listing[]> {
    const { city, region, checkin, checkout, adults, children } = params;
    const listings: Listing[] = [];

    const formattedCity = city.replace(/\s+/g, '-');
    const formattedRegion = region.replace(/\s+/g, '-');
    const searchUrl = `https://www.airbnb.co.in/s/${formattedCity}--${formattedRegion}/homes?checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children}&source=structured_search_input_header`;

    console.log(`Navigating to: ${searchUrl}`);

    // Rotate user agents
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const browser = await puppeteer.launch({
        headless: false, // Run in non-headless mode to appear more human-like
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled', // Disable automation detection
            '--disable-features=IsolateOrigins,site-per-process', // Disable some security features
            '--start-maximized',
            '--window-size=1920,1080',
            '--disable-web-security',
            '--disable-features=CrossSiteDocumentBlockingIfIsolating',
            '--disable-site-isolation-trials'
        ],
        defaultViewport: null, // Use the window size
    });

    let page: Page | null = null;

    try {
        page = await browser.newPage();

        // Set up stealth mode
        await page.setUserAgent(randomUserAgent);
        await page.setViewport({ width: 1920, height: 1080 });

        // Override navigator properties to hide automation
        await page.evaluateOnNewDocument(() => {
            // Override the navigator.webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });

            // Override navigator.plugins to appear more realistic
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });

            // Override navigator.languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });

            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters: any) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: 'denied' } as PermissionStatus) :
                    originalQuery(parameters)
            );

            // Override chrome property
            (window as any).chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };
        });

        // Add extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        });

        // Navigate with random delay
        await randomDelay(1000, 3000);
        
        try {
            await page.goto(searchUrl, { 
                waitUntil: 'domcontentloaded', // Less strict than networkidle0
                timeout: 60000 
            });
        } catch (navError) {
            console.log("Initial navigation timed out, but continuing...");
        }

        // Check if we're blocked
        if (await checkIfBlocked(page)) {
            console.error("Detected blocking mechanism. Trying alternative approach...");
            
            // Try to refresh with different timing
            await randomDelay(5000, 10000);
            await page.reload({ waitUntil: 'domcontentloaded' });
        }

        // Simulate human behavior
        await humanLikeMouseMove(page);
        await randomDelay(2000, 4000);
        await humanLikeScroll(page);

        console.log(`Waiting for listing cards with selector: ${LISTING_CARD_SELECTOR}`);
        
        // Try multiple times with different strategies
        let listingElements: ElementHandle<Element>[] = [];
        let attempts = 0;
        const maxAttempts = 3;

        while (listingElements.length === 0 && attempts < maxAttempts) {
            attempts++;
            console.log(`Attempt ${attempts} to find listings...`);

            try {
                // Wait for any content to load
                await page.waitForSelector('div[data-testid]', { timeout: 20000 });
                
                // Scroll to trigger lazy loading
                for (let i = 0; i < 3; i++) {
                    await humanLikeScroll(page);
                    await randomDelay(1000, 2000);
                }

                // Try to find listing cards
                listingElements = await page.$$(LISTING_CARD_SELECTOR);
                
                if (listingElements.length === 0) {
                    // Try alternative selectors
                    console.log("Trying alternative selectors...");
                    listingElements = await page.$$('div[itemprop="itemListElement"]');
                    
                    if (listingElements.length === 0) {
                        listingElements = await page.$$('div[data-testid*="listing"]');
                    }
                }

            } catch (e) {
                console.log(`Attempt ${attempts} failed:`, e instanceof Error ? e.message : String(e));
                
                if (attempts < maxAttempts) {
                    await randomDelay(3000, 5000);
                    await page.reload({ waitUntil: 'domcontentloaded' });
                }
            }
        }

        console.log(`Found ${listingElements.length} potential listing elements.`);
        
        if (listingElements.length === 0) {
            console.log("No listing card elements found. Saving screenshot for debugging.");
            await page.screenshot({ path: `no_elements_${new Date().toISOString().replace(/:/g, '-')}.png`, fullPage: true });
            
            // Log page structure for debugging
            const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 1000));
            console.log("Page HTML sample:", bodyHTML);
        }

        // Process listings with human-like delays
        for (let i = 0; i < listingElements.length; i++) {
            if (listings.length >= numberOfListings) break;

            const card = listingElements[i];
            let name: string | null = 'N/A';
            let priceText: string | null = 'N/A';
            let url: string | undefined = undefined;
            let priceQualifier: string | null = 'N/A';

            try {
                // Random delay between processing items
                await randomDelay(500, 1500);

                // Try multiple strategies to get the name
                const nameElement = await card.$(TITLE_SELECTOR);
                if (nameElement) {
                    name = await page.evaluate(el => el.textContent?.trim() || null, nameElement);
                } else {
                    // Try alternative selectors for name
                    const altNameElement = await card.$('div[id*="title"]') || await card.$('meta[itemprop="name"]');
                    if (altNameElement) {
                        name = await page.evaluate(el => {
                            if (el.tagName === 'META') {
                                return el.getAttribute('content');
                            }
                            return el.textContent?.trim() || null;
                        }, altNameElement);
                    }
                }

                // Try to extract price with multiple strategies
                let priceElement: ElementHandle<Element> | null = await card.$(PRICE_BUTTON_SPAN_SELECTOR);
                if (priceElement) {
                    priceText = await page.evaluate(el => el.textContent?.trim() || null, priceElement);
                } else {
                    // Multiple fallback strategies
                    const priceSelectors = [
                        PRICE_GENERAL_SELECTOR,
                        'span[aria-label*="price"]',
                        'span[aria-label*="₹"]',
                        'div[aria-label*="₹"]',
                        'span:has-text("₹")'
                    ];

                    for (const selector of priceSelectors) {
                        try {
                            priceElement = await card.$(selector);
                            if (priceElement) {
                                priceText = await page.evaluate(el => el.textContent?.trim() || null, priceElement);
                                if (priceText && priceText.includes('₹')) break;
                            }
                        } catch (e) {
                            // Continue with next selector
                        }
                    }
                }

                const linkElement = await card.$(LINK_SELECTOR) || await card.$('a[href*="/rooms/"]');
                if (linkElement) {
                    url = await page.evaluate(el => (el as HTMLAnchorElement).href, linkElement);
                }

                if (name && name !== 'N/A' && priceText && priceText !== 'N/A') {
                    const cleanedPrice = priceText.replace(/₹|,/g, '').replace(/per night/gi, '').trim().split(' ')[0];
                    listings.push({ name, price: `${cleanedPrice} (${priceQualifier || 'total'})`, url });
                    console.log(`Successfully scraped listing ${listings.length}: ${name}`);
                }

            } catch (e) {
                console.error(`Error processing card ${i+1}:`, e instanceof Error ? e.message : String(e));
            }
        }

    } catch (error) {
        console.error("Error during scraping:", error);
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        if (page) {
            await page.screenshot({ path: `error_screenshot_${timestamp}.png`, fullPage: true });
            console.log(`Screenshot saved to error_screenshot_${timestamp}.png`);
        }
    } finally {
        await browser.close();
    }

    return listings.slice(0, numberOfListings);
}

// --- Main execution ---
async function main() {
    // Parse command line arguments or use defaults
    const args = process.argv.slice(2);
    
    let searchParameters: SearchParams;
    
    if (args.length >= 5) {
        // Command line arguments: city region checkin checkout adults [children]
        searchParameters = {
            city: args[0],
            region: args[1],
            checkin: args[2],
            checkout: args[3],
            adults: parseInt(args[4]),
            children: args[5] ? parseInt(args[5]) : 0
        };
    } else {
        // Default parameters if no command line args provided
        console.log("No parameters provided. Using default search parameters.");
        console.log("Usage: node dist/airbnb_scraper_v2.js <city> <region> <checkin> <checkout> <adults> [children]");
        console.log("Example: node dist/airbnb_scraper_v2.js Shimla Himachal-Pradesh 2025-09-10 2025-09-12 2 1");
        console.log("\nUsing default parameters...\n");
        
        searchParameters = {
            city: "Shimla",
            region: "Himachal-Pradesh",
            checkin: "2025-09-10", // Use a future date
            checkout: "2025-09-12", // Use a future date
            adults: 1,
            children: 1
        };
    }

    console.log(`Starting Airbnb scraper with anti-bot measures...`);
    console.log(`Target: ${searchParameters.city}, ${searchParameters.region}`);
    console.log(`Dates: ${searchParameters.checkin} to ${searchParameters.checkout}`);
    console.log(`Guests: ${searchParameters.adults} adults, ${searchParameters.children} children\n`);

    let successfulRun = false;
    let attemptCount = 0;
    const maxRetries = 5;

    while (!successfulRun && attemptCount < maxRetries) {
        attemptCount++;
        console.log(`\n=== Attempt ${attemptCount} of ${maxRetries} ===`);
        
        // Add delay between retries
        if (attemptCount > 1) {
            const retryDelay = attemptCount * 5000; // Increase delay with each retry
            console.log(`Waiting ${retryDelay/1000} seconds before retry...`);
            await randomDelay(retryDelay, retryDelay + 2000);
        }

        const topListings = await scrapeAirbnb(searchParameters, 10);

        if (topListings.length > 0) {
            successfulRun = true;
            console.log(`\n✅ SUCCESS! Found ${topListings.length} listings:`);
            console.log('='.repeat(50));
            
            topListings.forEach((listing, index) => {
                console.log(`\n${index + 1}. ${listing.name}`);
                console.log(`   💰 Price: ₹${listing.price}`);
                console.log(`   🔗 URL: ${listing.url || 'N/A'}`);
            });
            console.log('\n' + '='.repeat(50));
        } else {
            console.log(`❌ Attempt ${attemptCount} failed - no listings found`);
        }
    }

    if (!successfulRun) {
        console.log("\n⚠️  All attempts failed. Airbnb's anti-bot measures may have been updated.");
        console.log("Consider trying:");
        console.log("- Using a residential proxy");
        console.log("- Running during different times of day");
        console.log("- Using a different IP address");
        console.log("- Implementing CAPTCHA solving service");
    }
}

// Simple wrapper function for easier programmatic usage
export async function searchAirbnb(
    city: string,
    region: string,
    checkin: string,
    checkout: string,
    adults: number,
    children: number = 0,
    maxListings: number = 10
): Promise<Listing[]> {
    const searchParams: SearchParams = {
        city,
        region,
        checkin,
        checkout,
        adults,
        children
    };
    
    return await scrapeAirbnb(searchParams, maxListings);
}

// Export the scrapeAirbnb function for use as a module
export { scrapeAirbnb };
export type { SearchParams, Listing };

// Only run main if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}
import puppeteer from 'puppeteer';
import { URLSearchParams } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// --- Interfaces for structured data ---
interface Slot {
    date: string;
    startTime: string;
    spotsLeft?: string;
}

interface Experience {
    name: string;
    imageUrl: string | undefined;
    cost: string;
    duration: string;
    experiencePageUrl: string | undefined;
    availableSlots: Slot[];
    latitude?: number;
    longitude?: number;
}

// --- Helper Functions ---

/**
 * Experience type categories mapping to actual Airbnb tag IDs
 * Based on real Airbnb filter interface analysis
 */
const EXPERIENCE_TYPES = {
    'architecture': 'Tag:9010',
    'art': 'Tag:8953',
    'beauty': 'Tag:8959',
    'cooking': 'Tag:8957',
    'cultural-tours': 'Tag:8970',
    'dining': 'Tag:8972',
    'flying': 'Tag:9011',
    'food-tours': 'Tag:8960',
    'galleries': 'Tag:8954',
    'landmarks': 'Tag:8971',
    'museums': 'Tag:9013',
    'outdoors': 'Tag:8961',
    'performances': 'Tag:9048',
    'shopping-fashion': 'Tag:8955',
    'tastings': 'Tag:9012',
    'water-sports': 'Tag:8962',
    'wellness': 'Tag:8968',
    'wildlife': 'Tag:8963',
    'workouts': 'Tag:8969'
} as const;

type ExperienceType = keyof typeof EXPERIENCE_TYPES;

/**
 * Builds the Airbnb search URL with optional experience type filtering.
 */
function buildSearchUrl(
    location: string,
    checkin: string, // YYYY-MM-DD
    checkout: string, // YYYY-MM-DD
    adults: number,
    timeOfDay: 'morning' | 'afternoon' | 'evening',
    experienceTypes?: ExperienceType[]
): string {
    const baseUrl = `https://www.airbnb.com/s/${encodeURIComponent(location.split(',')[0].trim())}/experiences`;
    const params = new URLSearchParams({
        'refinement_paths[]': '/experiences',
        date_picker_type: 'calendar',
        checkin,
        checkout,
        adults: adults.toString(),
        'experience_time_of_day[]': timeOfDay,
        query: location, // Full location string for query
        source: 'structured_search_input_header', // Mimic real search
    });

    // Add experience type filters if specified
    if (experienceTypes && experienceTypes.length > 0) {
        // Add kg_or_tags[] parameters for each selected type
        experienceTypes.forEach(type => {
            const tagId = EXPERIENCE_TYPES[type];
            if (tagId) {
                params.append('kg_or_tags[]', tagId);
            }
        });
        
        // Add selected_filter_order[] parameters to maintain filter state
        // Based on Airbnb's URL pattern analysis
        experienceTypes.forEach(type => {
            const tagId = EXPERIENCE_TYPES[type];
            if (tagId) {
                params.append('selected_filter_order[]', `kg_or_tags:${tagId}`);
            }
        });
        
        // Add time of day to selected filter order if it exists
        params.append('selected_filter_order[]', `experience_time_of_day:${timeOfDay}`);
        
        // Add update_selected_filters parameter as seen in real URLs
        params.append('update_selected_filters', 'false');
    }

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Create a stealth browser instance with realistic settings
 */
async function createStealthBrowser() {
    const browser = await puppeteer.launch({
        headless: true, // Running in headless mode for efficiency
        defaultViewport: { width: 1366, height: 768 },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-features=VizDisplayCompositor',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    });

    const page = await browser.newPage();
    
    // Set realistic headers
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Cache-Control': 'max-age=0'
    });

    // Add random mouse movements and realistic behavior
    await page.evaluateOnNewDocument(() => {
        // Override the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            get: function() {
                // this just needs to have `length > 0`, but we could mock the plugins too
                return [1, 2, 3, 4, 5];
            },
        });
        
        // Override the `languages` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: function() {
                return ['en-US', 'en'];
            },
        });
        
        // Override the `webdriver` property to remove it entirely.
        delete navigator.webdriver;
    });

    return { browser, page };
}

/**
 * Add random delays to simulate human behavior
 */
function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Scrape experiences from search results page
 */
async function scrapeSearchResults(page: any, searchUrl: string): Promise<Partial<Experience>[]> {
    console.log(`Navigating to: ${searchUrl}`);
    
    try {
        await page.goto(searchUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Wait for content to load and add random delay
        await randomDelay(2000, 4000);
        
        // Wait for experience cards to load
        try {
            await page.waitForSelector('[data-testid="card-container"]', { timeout: 10000 });
        } catch (error) {
            console.log('No experience cards found, trying alternative selectors...');
            
            // Try different selectors that Airbnb might use
            const selectors = [
                '[data-testid="listing-card-title"]',  
                '.c1l1h97y',
                '[role="group"]',
                '.gig1e2m'
            ];
            
            let found = false;
            for (const selector of selectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    found = true;
                    break;
                } catch {}
            }
            
            if (!found) {
                console.log('No content found with any selector. Page might be blocked or structure changed.');
                // Save screenshot for debugging
                await page.screenshot({ path: 'debug-search-page.png' });
                return [];
            }
        }

        // Extract experience data
        const experiences = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('[data-testid="card-container"]'));
            console.log(`Found ${cards.length} experience cards`);
            
            return cards.slice(0, 3).map((card: any) => {
                try {
                    const nameElement = card.querySelector('[data-testid="listing-card-title"]') || 
                                       card.querySelector('h3') || 
                                       card.querySelector('[role="heading"]');
                    const name = nameElement?.textContent?.trim() || '';

                    const imgElement = card.querySelector('img[elementtiming="LCP-target"]') || 
                                      card.querySelector('img');
                    const imageUrl = imgElement?.getAttribute('data-original-uri') || 
                                    imgElement?.getAttribute('src') || '';

                    // Look for price information with better parsing
                    let cost = '';
                    const priceSelectors = [
                        'span._1qgfaxb1',
                        '[data-testid="price"]',
                        '[aria-label*="price"]',
                        'span[class*="price"]'
                    ];
                    
                    for (const selector of priceSelectors) {
                        const priceElement = card.querySelector(selector);
                        if (priceElement?.textContent?.trim()) {
                            cost = priceElement.textContent.trim();
                            // Clean up cost text - take only the first price mention
                            const priceMatch = cost.match(/From\s+₹[\d,]+/);
                            if (priceMatch) {
                                cost = priceMatch[0];
                            }
                            break;
                        }
                    }

                    // Look for duration with better parsing
                    let duration = '';
                    const allText = card.textContent || '';
                    const durationMatch = allText.match(/(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs)/i);
                    if (durationMatch) {
                        duration = `${durationMatch[1]} ${durationMatch[1] === '1' ? 'hour' : 'hours'}`;
                    }

                    const linkElement = card.querySelector('a[href*="/experiences/"]');
                    const relativeUrl = linkElement?.getAttribute('href');
                    const experiencePageUrl = relativeUrl ? `https://www.airbnb.com${relativeUrl}` : '';

                    if (name && experiencePageUrl) {
                        return {
                            name,
                            imageUrl: imageUrl || undefined,
                            cost: cost || 'N/A',
                            duration: duration || 'N/A',
                            experiencePageUrl
                        };
                    }
                    return null;
                } catch (error) {
                    console.error('Error parsing card:', error);
                    return null;
                }
            }).filter(Boolean);
        });

        console.log(`Successfully extracted ${experiences.length} experiences`);
        return experiences;

    } catch (error) {
        console.error('Error scraping search results:', error);
        // Save screenshot for debugging
        await page.screenshot({ path: 'debug-error.png' });
        return [];
    }
}

/**
 * Scrape slots and coordinates from individual experience page
 */
async function scrapeExperienceDetails(page: any, url: string): Promise<{slots: Slot[], coordinates?: {latitude: number, longitude: number}}> {
    try {
        console.log(`Scraping slots from: ${url}`);
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        await randomDelay(1500, 3000);

        // Look for slot containers
        const slotsSelectors = [
            '[data-testid="availability-calendar-date-button"]',
            'button[aria-pressed]',
            '.a3jc39e a.s10a4xcu',
            '[role="button"][aria-label*="Date"]'
        ];

        let slots: Slot[] = [];
        
        for (const selector of slotsSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                slots = await page.evaluate((sel: string) => {
                    const slotElements = Array.from(document.querySelectorAll(sel));
                    return slotElements.slice(0, 5).map((element: any) => {
                        try {
                            const fullText = element.textContent?.trim() || '';
                            const ariaLabel = element.getAttribute('aria-label') || '';
                            
                            // Try to extract date, time, and availability info
                            let date = '';
                            let startTime = '';
                            let spotsLeft = '';

                            // Enhanced date extraction with better regex patterns
                            const dateMatches = [
                                // Match "Today, 22 June" or "Tomorrow, 23 June"
                                fullText.match(/(Today|Tomorrow),\s*(\d{1,2}\s+\w+)(?=\d)/),
                                // Match "Wednesday, 25 June" etc.
                                fullText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(\d{1,2}\s+\w+)(?=\d)/),
                                // Match just "Today" or "Tomorrow"
                                fullText.match(/(Today|Tomorrow)(?=\d)/),
                                // Match weekday names
                                fullText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?=\d)/),
                                // Try aria-label as fallback
                                ariaLabel.match(/(Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*(\d{1,2}\s+\w+)/),
                                // Last resort: just day and month
                                fullText.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))/i)
                            ];
                            
                            for (const match of dateMatches) {
                                if (match) {
                                    if (match[1] && match[2]) {
                                        date = `${match[1]}, ${match[2]}`;
                                    } else if (match[1]) {
                                        date = match[1];
                                    }
                                    break;
                                }
                            }

                            // Enhanced time extraction with better patterns
                            const timeMatches = [
                                // Match "4:00 – 6:00 pm" format (get start time and period)
                                fullText.match(/(\d{1,2}:\d{2})\s*–\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)/i),
                                // Match "10:30 – 11:30 am" format  
                                fullText.match(/(\d{1,2}:\d{2})\s*–\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)/i),
                                // Match standalone time with AM/PM
                                fullText.match(/(\d{1,2}:\d{2})\s*(AM|PM|am|pm)/i),
                                // Try aria-label
                                ariaLabel.match(/(\d{1,2}:\d{2})\s*–?\s*.*?\s*(AM|PM|am|pm)/i),
                                // Last resort: just time without AM/PM
                                fullText.match(/(\d{1,2}:\d{2})/),
                            ];
                            
                            for (const match of timeMatches) {
                                if (match) {
                                    startTime = match[1];
                                    if (match[2]) {
                                        startTime += ` ${match[2].toLowerCase()}`;
                                    }
                                    break;
                                }
                            }

                            // Enhanced spots extraction
                            const spotsMatch = fullText.match(/(\d+)\s*spots?\s*left/i);
                            if (spotsMatch) {
                                spotsLeft = `${spotsMatch[1]} spots left`;
                            }

                            // Clean up extracted data
                            if (date) {
                                // Remove any trailing digits or extra characters
                                date = date.replace(/\d$/, '').trim();
                                // Ensure proper formatting
                                date = date.replace(/,\s+/, ', ');
                            }

                            if (startTime) {
                                // Ensure consistent AM/PM formatting
                                startTime = startTime.replace(/\s*(am|pm)/i, (match, period) => ` ${period.toLowerCase()}`);
                            }

                            if (date || startTime) {
                                return {
                                    date: date || 'Date not specified',
                                    startTime: startTime || 'Time not specified',
                                    spotsLeft: spotsLeft || undefined
                                };
                            }
                            return null;
                        } catch (error) {
                            console.error('Error parsing slot element:', error);
                            return null;
                        }
                    }).filter(Boolean);
                }, selector);
                
                if (slots.length > 0) {
                    console.log(`Found ${slots.length} slots using selector: ${selector}`);
                    break;
                }
            } catch (error) {
                continue; // Try next selector
            }
        }

        // Extract coordinates from page HTML
        let coordinates: {latitude: number, longitude: number} | undefined;
        try {
            const pageContent = await page.content();
            const coordinateMatch = pageContent.match(/"userSuppliedCoordinate":\{"__typename":"Coordinate","latitude":([\d.-]+),"longitude":([\d.-]+)\}/);
            
            if (coordinateMatch) {
                const latitude = parseFloat(coordinateMatch[1]);
                const longitude = parseFloat(coordinateMatch[2]);
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    coordinates = { latitude, longitude };
                    console.log(`Found coordinates: ${latitude}, ${longitude}`);
                }
            }
        } catch (coordError) {
            console.warn('Could not extract coordinates:', coordError);
        }

        return { slots, coordinates };

    } catch (error) {
        console.error(`Error scraping experience details from ${url}:`, error);
        return { slots: [], coordinates: undefined };
    }
}

// --- Main Scraper Function ---
async function scrapeAirbnbExperiences(
    location: string,
    checkin: string,
    checkout: string,
    adults: number,
    timeOfDay: 'morning' | 'afternoon' | 'evening',
    experienceTypes?: ExperienceType[]
): Promise<Experience[]> {
    const { browser, page } = await createStealthBrowser();
    
    try {
        const searchUrl = buildSearchUrl(location, checkin, checkout, adults, timeOfDay, experienceTypes);
        
        // Scrape search results
        const partialExperiences = await scrapeSearchResults(page, searchUrl);
        
        if (partialExperiences.length === 0) {
            console.log('No experiences found on the search results page.');
            return [];
        }

        console.log(`Found ${partialExperiences.length} experiences on search page. Fetching details...`);

        const fullExperiences: Experience[] = [];

        for (const partialExperience of partialExperiences) {
            if (!partialExperience.experiencePageUrl) {
                console.warn(`Skipping experience "${partialExperience.name}" due to missing URL.`);
                continue;
            }

            // Add delay between requests to avoid rate limiting
            await randomDelay(2000, 5000);
            
            const experienceDetails = await scrapeExperienceDetails(page, partialExperience.experiencePageUrl);
            
            fullExperiences.push({
                name: partialExperience.name || 'N/A',
                imageUrl: partialExperience.imageUrl,
                cost: partialExperience.cost || 'N/A',
                duration: partialExperience.duration || 'N/A',
                experiencePageUrl: partialExperience.experiencePageUrl,
                availableSlots: experienceDetails.slots,
                latitude: experienceDetails.coordinates?.latitude,
                longitude: experienceDetails.coordinates?.longitude,
            });

            if (fullExperiences.length >= 3) {
                break;
            }
        }

        return fullExperiences;

    } finally {
        await browser.close();
    }
}

// --- Command Line Interface ---
interface ScraperArguments {
    location: string;
    checkin: string;
    checkout: string;
    adults: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    experienceTypes?: ExperienceType[];
}

function parseArguments(): ScraperArguments {
    const argv = yargs(hideBin(process.argv))
        .usage('Usage: $0 --location <location> --checkin <date> --checkout <date> [options]')
        .option('location', {
            alias: 'l',
            describe: 'Destination location (e.g., "Goa, India", "Paris, France")',
            type: 'string',
            demandOption: true
        })
        .option('checkin', {
            alias: ['ci'],
            describe: 'Check-in date in YYYY-MM-DD format',
            type: 'string',
            demandOption: true
        })
        .option('checkout', {
            alias: ['co'],
            describe: 'Check-out date in YYYY-MM-DD format',
            type: 'string',
            demandOption: true
        })
        .option('adults', {
            alias: 'a',
            describe: 'Number of adults',
            type: 'number',
            default: 2
        })
        .option('timeOfDay', {
            alias: 't',
            describe: 'Preferred time of day for experiences',
            choices: ['morning', 'afternoon', 'evening'] as const,
            default: 'morning' as const
        })
        .option('types', {
            alias: 'e',
            describe: 'Experience types to filter by (comma-separated)',
            type: 'string',
            coerce: (value: string) => {
                if (!value) return undefined;
                return value.split(',').map(type => type.trim()) as ExperienceType[];
            }
        })
        .example('$0 --location "Paris, France" --checkin 2025-03-15 --checkout 2025-03-17', 'Scrape Paris experiences')
        .example('$0 -l "Tokyo, Japan" -ci 2025-04-01 -co 2025-04-03 -a 4 -t evening', 'Scrape Tokyo evening experiences for 4 adults')
        .example('$0 -l "Goa, India" -ci 2025-02-15 -co 2025-02-17 --types outdoors,cooking', 'Scrape outdoor and cooking experiences in Goa')
        .help()
        .alias('help', 'h')
        .parseSync();

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(argv.checkin)) {
        console.error('Error: Check-in date must be in YYYY-MM-DD format');
        process.exit(1);
    }
    if (!dateRegex.test(argv.checkout)) {
        console.error('Error: Check-out date must be in YYYY-MM-DD format');
        process.exit(1);
    }

    // Validate that checkout is after checkin
    if (new Date(argv.checkout) <= new Date(argv.checkin)) {
        console.error('Error: Check-out date must be after check-in date');
        process.exit(1);
    }

    return {
        location: argv.location,
        checkin: argv.checkin,
        checkout: argv.checkout,
        adults: argv.adults,
        timeOfDay: argv.timeOfDay,
        experienceTypes: argv.types
    };
}

async function main() {
    try {
        const args = parseArguments();
        
        console.log('🚀 Starting Airbnb experiences scraper...');
        console.log(`📍 Location: ${args.location}`);
        console.log(`📅 Dates: ${args.checkin} to ${args.checkout}`);
        console.log(`👥 Adults: ${args.adults}`);
        console.log(`⏰ Time preference: ${args.timeOfDay}`);
        if (args.experienceTypes && args.experienceTypes.length > 0) {
            console.log(`🎯 Experience types: ${args.experienceTypes.join(', ')}`);
        }
        console.log('');

        const experiences = await scrapeAirbnbExperiences(
            args.location,
            args.checkin,
            args.checkout,
            args.adults,
            args.timeOfDay,
            args.experienceTypes
        );
        
        if (experiences.length > 0) {
            console.log(`\n🎉 Found ${experiences.length} experiences in ${args.location}:`);
            console.log('=' .repeat(60));
            
            experiences.forEach((exp, index) => {
                console.log(`\n🌟 Experience #${index + 1}:`);
                console.log(`  📌 Name: ${exp.name}`);
                console.log(`  🖼️  Image: ${exp.imageUrl}`);
                console.log(`  💰 Cost: ${exp.cost}`);
                console.log(`  ⏱️  Duration: ${exp.duration}`);
                console.log(`  🔗 URL: ${exp.experiencePageUrl}`);
                if (exp.latitude && exp.longitude) {
                    console.log(`  📍 Location: ${exp.latitude}, ${exp.longitude}`);
                }
                if (exp.availableSlots.length > 0) {
                    console.log('  📊 Available Slots:');
                    exp.availableSlots.forEach(slot => {
                        console.log(`    • ${slot.date}, ${slot.startTime}${slot.spotsLeft ? ` (${slot.spotsLeft})` : ''}`);
                    });
                } else {
                    console.log('  📊 Available Slots: None found or require manual checking');
                }
                console.log('  ' + '-'.repeat(50));
            });
        } else {
            console.log(`\n❌ No experiences found for ${args.location} on the specified dates.`);
            console.log('💡 Try:');
            console.log('   - Different dates');
            console.log('   - Different location format');
            console.log('   - Check debug screenshots if available');
        }
    } catch (error) {
        console.error('\n💥 Error in scraper execution:', error);
        process.exit(1);
    }
}

// Run the scraper
main();
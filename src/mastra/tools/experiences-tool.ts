import { createTool } from '@mastra/core';
import { z } from 'zod';
import puppeteer from 'puppeteer';
import { URLSearchParams } from 'url';

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

// Experience type categories mapping to actual Airbnb tag IDs
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
        query: location,
        source: 'structured_search_input_header',
    });

    // Add experience type filters if specified
    if (experienceTypes && experienceTypes.length > 0) {
        experienceTypes.forEach(type => {
            const tagId = EXPERIENCE_TYPES[type];
            if (tagId) {
                params.append('kg_or_tags[]', tagId);
                params.append('selected_filter_order[]', `kg_or_tags:${tagId}`);
            }
        });
        
        params.append('selected_filter_order[]', `experience_time_of_day:${timeOfDay}`);
        params.append('update_selected_filters', 'false');
    }

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Create a stealth browser instance with realistic settings
 */
async function createStealthBrowser() {
    const browser = await puppeteer.launch({
        headless: true,
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

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'plugins', {
            get: function() {
                return [1, 2, 3, 4, 5];
            },
        });
        
        Object.defineProperty(navigator, 'languages', {
            get: function() {
                return ['en-US', 'en'];
            },
        });
        
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

        await randomDelay(2000, 4000);
        
        try {
            await page.waitForSelector('[data-testid="card-container"]', { timeout: 10000 });
        } catch (error) {
            console.log('No experience cards found, trying alternative selectors...');
            
            const selectors = [
                '[data-testid="listing-card-title"]',  
                '.c1l1h97y',
                '[role="group"]',
                '.g1qv1ctd',
                '[data-testid="listing-card"]'
            ];
            
            let foundSelector = null;
            for (const selector of selectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    foundSelector = selector;
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            if (!foundSelector) {
                console.log('No experience cards found with any selector');
                return [];
            }
        }

        const experiences = await page.evaluate(() => {
            const cards = document.querySelectorAll('[data-testid="card-container"], [data-testid="listing-card"], .c1l1h97y, [role="group"]');
            const results: Partial<Experience>[] = [];

            cards.forEach((card: Element, index: number) => {
                if (index >= 10) return; // Limit to first 10 cards
                
                try {
                    // Try multiple selectors for the title
                    const titleSelectors = [
                        '[data-testid="listing-card-title"]',
                        '.t1jojoys',
                        'h3',
                        '.t6mzqp7',
                        '[id^="title_"]'
                    ];
                    
                    let name = '';
                    for (const selector of titleSelectors) {
                        const titleElement = card.querySelector(selector);
                        if (titleElement?.textContent?.trim()) {
                            name = titleElement.textContent.trim();
                            break;
                        }
                    }

                    // Try multiple selectors for the image
                    const imageSelectors = [
                        'img[data-testid="picture"]',
                        'img[src*="airbnb"]',
                        'img',
                        '[data-testid="picture"] img'
                    ];
                    
                    let imageUrl = '';
                    for (const selector of imageSelectors) {
                        const imgElement = card.querySelector(selector) as HTMLImageElement;
                        if (imgElement?.src) {
                            imageUrl = imgElement.src;
                            break;
                        }
                    }

                    // Try multiple selectors for the price
                    const priceSelectors = [
                        '[data-testid="price-availability"]',
                        '.pquyp1l',
                        '.a8jt5op',
                        '.t1a9j9y7',
                        '[class*="price"]'
                    ];
                    
                    let cost = '';
                    for (const selector of priceSelectors) {
                        const priceElement = card.querySelector(selector);
                        if (priceElement?.textContent?.trim()) {
                            cost = priceElement.textContent.trim();
                            break;
                        }
                    }

                    // Try to find duration information
                    const durationSelectors = [
                        '.t1a9j9y7',
                        '.s1cjsi4j',
                        '[class*="duration"]'
                    ];
                    
                    let duration = '';
                    for (const selector of durationSelectors) {
                        const durationElement = card.querySelector(selector);
                        if (durationElement?.textContent?.includes('hour') || durationElement?.textContent?.includes('hr')) {
                            duration = durationElement.textContent.trim();
                            break;
                        }
                    }

                    // Try to find the experience page URL
                    const linkSelectors = [
                        'a[href*="/experiences/"]',
                        'a[data-testid="listing-card-title"]',
                        'a'
                    ];
                    
                    let experiencePageUrl = '';
                    for (const selector of linkSelectors) {
                        const linkElement = card.querySelector(selector) as HTMLAnchorElement;
                        if (linkElement?.href?.includes('/experiences/')) {
                            experiencePageUrl = linkElement.href.startsWith('http') ? 
                                linkElement.href : 
                                `https://www.airbnb.com${linkElement.href}`;
                            break;
                        }
                    }

                    if (name && (imageUrl || cost || experiencePageUrl)) {
                        results.push({
                            name,
                            imageUrl: imageUrl || undefined,
                            cost: cost || 'Price not available',
                            duration: duration || 'Duration not specified',
                            experiencePageUrl: experiencePageUrl || undefined,
                            availableSlots: []
                        });
                    }
                } catch (error) {
                    console.log(`Error processing card ${index}:`, error);
                }
            });

            return results;
        });

        console.log(`Found ${experiences.length} experiences on search page`);
        return experiences.slice(0, 2); // Return only first 2 experiences

    } catch (error) {
        console.error('Error in scrapeSearchResults:', error);
        return [];
    }
}

/**
 * Scrape detailed information from an individual experience page
 */
async function scrapeExperienceDetails(page: any, url: string): Promise<{slots: Slot[], coordinates?: {latitude: number, longitude: number}}> {
    try {
        console.log(`Fetching details for: ${url}`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 20000 
        });

        await randomDelay(1000, 3000);

        const details = await page.evaluate(() => {
            const slots: Slot[] = [];
            let coordinates: {latitude: number, longitude: number} | undefined;

            // Try to find available slots/dates
            const dateSelectors = [
                '[data-testid="availability-calendar-date"]',
                '.c1l9h97y',
                '[class*="calendar"]',
                '[data-testid="calendar-day"]'
            ];

            for (const selector of dateSelectors) {
                const dateElements = document.querySelectorAll(selector);
                dateElements.forEach((element, index) => {
                    if (index >= 5) return; // Limit to first 5 slots
                    
                    const dateText = element.textContent?.trim();
                    if (dateText && !dateText.includes('unavailable')) {
                        slots.push({
                            date: dateText,
                            startTime: 'Time varies',
                            spotsLeft: 'Available'
                        });
                    }
                });
                
                if (slots.length > 0) break;
            }

            // Try to extract coordinates from map or script tags
            try {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const content = script.textContent || '';
                    
                    // Try multiple coordinate patterns
                    const patterns = [
                        /"lat":\s*(-?\d+\.?\d*)/,
                        /"latitude":\s*(-?\d+\.?\d*)/,
                        /"lat":\s*"(-?\d+\.?\d*)"/,
                        /lat:\s*(-?\d+\.?\d*)/,
                        /"location":\s*{\s*"lat":\s*(-?\d+\.?\d*)/
                    ];
                    
                    const lngPatterns = [
                        /"lng":\s*(-?\d+\.?\d*)/,
                        /"longitude":\s*(-?\d+\.?\d*)/,
                        /"lng":\s*"(-?\d+\.?\d*)"/,
                        /lng:\s*(-?\d+\.?\d*)/,
                        /"location":\s*{\s*"lat":\s*-?\d+\.?\d*,\s*"lng":\s*(-?\d+\.?\d*)/
                    ];
                    
                    let lat, lng;
                    
                    // Try each latitude pattern
                    for (const pattern of patterns) {
                        const match = content.match(pattern);
                        if (match) {
                            lat = parseFloat(match[1]);
                            break;
                        }
                    }
                    
                    // Try each longitude pattern
                    for (const pattern of lngPatterns) {
                        const match = content.match(pattern);
                        if (match) {
                            lng = parseFloat(match[1]);
                            break;
                        }
                    }
                    
                    if (lat && lng) {
                        coordinates = { latitude: lat, longitude: lng };
                        console.log(`Extracted coordinates: ${lat}, ${lng}`);
                        break;
                    }
                }
                
                // If no coordinates found in scripts, try meta tags
                if (!coordinates) {
                    const geoPosition = document.querySelector('meta[property="place:location:latitude"]');
                    const geoPositionLng = document.querySelector('meta[property="place:location:longitude"]');
                    
                    if (geoPosition && geoPositionLng) {
                        const lat = parseFloat(geoPosition.getAttribute('content') || '');
                        const lng = parseFloat(geoPositionLng.getAttribute('content') || '');
                        if (lat && lng) {
                            coordinates = { latitude: lat, longitude: lng };
                            console.log(`Extracted coordinates from meta: ${lat}, ${lng}`);
                        }
                    }
                }
                
            } catch (e) {
                console.log('Could not extract coordinates:', e);
            }

            return { slots, coordinates };
        });

        return details;

    } catch (error) {
        console.error(`Error scraping details for ${url}:`, error);
        return { slots: [] };
    }
}

/**
 * Main function to scrape Airbnb experiences
 */
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

            if (fullExperiences.length >= 2) {
                break;
            }
        }

        return fullExperiences;

    } finally {
        await browser.close();
    }
}

// Create the experiences tool
export const experiencesTool = createTool({
    id: 'experiences-tool',
    description: 'Search for experiences and activities in a destination using Airbnb',
    inputSchema: z.object({
        location: z.string().describe('Destination location (e.g., "Paris, France", "Tokyo, Japan")'),
        checkin: z.string().describe('Check-in date in YYYY-MM-DD format'),
        checkout: z.string().describe('Check-out date in YYYY-MM-DD format'),
        adults: z.number().default(2).describe('Number of adults'),
        timeOfDay: z.enum(['morning', 'afternoon', 'evening']).describe('Preferred time of day for experiences'),
        experienceTypes: z.array(z.enum([
            'architecture', 'art', 'beauty', 'cooking', 'cultural-tours', 'dining',
            'flying', 'food-tours', 'galleries', 'landmarks', 'museums', 'outdoors',
            'performances', 'shopping-fashion', 'tastings', 'water-sports', 'wellness',
            'wildlife', 'workouts'
        ])).optional().describe('Types of experiences to filter by')
    }),
    outputSchema: z.object({
        experiences: z.array(z.object({
            name: z.string(),
            imageUrl: z.string().optional(),
            cost: z.string(),
            duration: z.string(),
            experiencePageUrl: z.string().optional(),
            availableSlots: z.array(z.object({
                date: z.string(),
                startTime: z.string(),
                spotsLeft: z.string().optional()
            })),
            latitude: z.number().optional(),
            longitude: z.number().optional()
        }))
    }),
    execute: async ({ context }) => {
        const { location, checkin, checkout, adults, timeOfDay, experienceTypes } = context;
        
        try {
            const experiences = await scrapeAirbnbExperiences(
                location,
                checkin,
                checkout,
                adults,
                timeOfDay,
                experienceTypes
            );
            
            return { experiences };
        } catch (error) {
            console.error('Error in experiences tool:', error);
            return { experiences: [] };
        }
    }
}); 
/**
 * Extracts state abbreviation and zipcode from a full address string
 * Handles various address formats including Smarty autocomplete format
 * 
 * @param address - Full address string (e.g., "123 Main St, Springfield, KY 40069")
 * @returns Object with state and zipcode, or empty strings if not found
 */
export function extractStateAndZipcode(address: string): { state: string; zipcode: string } {
    if (!address || typeof address !== 'string') {
        return { state: '', zipcode: '' };
    }

    // Trim and normalize the address
    const normalizedAddress = address.trim();

    // US State abbreviations (all 50 states + DC)
    const stateAbbreviations = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
    ];

    let state = '';
    let zipcode = '';

    // Pattern 1: Smarty format - "Street, City, STATE ZIPCODE"
    // Example: "123 Main St, Springfield, KY 40069"
    const smartyPattern = /,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/;
    const smartyMatch = normalizedAddress.match(smartyPattern);
    
    if (smartyMatch) {
        const [, stateMatch, zipcodeMatch] = smartyMatch;
        if (stateAbbreviations.includes(stateMatch)) {
            state = stateMatch;
            zipcode = zipcodeMatch;
            return { state, zipcode };
        }
    }

    // Pattern 2: State and zipcode at the end with various separators
    // Example: "123 Main St Springfield KY 40069"
    const pattern2 = /\b([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/;
    const match2 = normalizedAddress.match(pattern2);
    
    if (match2) {
        const [, stateMatch, zipcodeMatch] = match2;
        if (stateAbbreviations.includes(stateMatch)) {
            state = stateMatch;
            zipcode = zipcodeMatch;
            return { state, zipcode };
        }
    }

    // Pattern 3: Zipcode only at the end (extract state separately)
    // Example: "123 Main St, Springfield, Kentucky 40069"
    const zipcodePattern = /\b(\d{5}(?:-\d{4})?)\s*$/;
    const zipcodeMatch = normalizedAddress.match(zipcodePattern);
    
    if (zipcodeMatch) {
        zipcode = zipcodeMatch[1];
        
        // Try to find state abbreviation before the zipcode
        const beforeZipcode = normalizedAddress.substring(0, zipcodeMatch.index);
        const statePattern = new RegExp(`\\b(${stateAbbreviations.join('|')})\\b(?!.*\\b(?:${stateAbbreviations.join('|')})\\b)`, 'i');
        const stateMatch = beforeZipcode.match(statePattern);
        
        if (stateMatch) {
            state = stateMatch[1].toUpperCase();
        }
    }

    // Pattern 4: Look for state abbreviation anywhere in the address (last occurrence)
    if (!state) {
        const statePattern = new RegExp(`\\b(${stateAbbreviations.join('|')})\\b`, 'gi');
        const allStateMatches = normalizedAddress.match(statePattern);
        
        if (allStateMatches && allStateMatches.length > 0) {
            // Take the last match (most likely to be the actual state)
            state = allStateMatches[allStateMatches.length - 1].toUpperCase();
        }
    }

    // Pattern 5: Look for zipcode anywhere if not found at the end
    if (!zipcode) {
        const anyZipcodePattern = /\b(\d{5}(?:-\d{4})?)\b/;
        const anyZipcodeMatch = normalizedAddress.match(anyZipcodePattern);
        
        if (anyZipcodeMatch) {
            zipcode = anyZipcodeMatch[1];
        }
    }

    return { state, zipcode };
}

/**
 * Validates if a string is a valid US zipcode
 * @param zipcode - Zipcode string to validate
 * @returns true if valid zipcode format
 */
export function isValidZipcode(zipcode: string): boolean {
    if (!zipcode) return false;
    // Matches 5-digit or 5+4 digit zipcodes
    return /^\d{5}(-\d{4})?$/.test(zipcode);
}

/**
 * Validates if a string is a valid US state abbreviation
 * @param state - State abbreviation to validate
 * @returns true if valid state abbreviation
 */
export function isValidStateAbbreviation(state: string): boolean {
    if (!state) return false;
    
    const stateAbbreviations = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
    ];
    
    return stateAbbreviations.includes(state.toUpperCase());
}

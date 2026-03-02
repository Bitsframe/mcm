/**
 * Extracts city, state abbreviation and zipcode from a full address string
 * Also returns the clean street address without city, state and zipcode
 * 
 * @param address - Full address string (e.g., "123 Main St, Springfield, KY 40069")
 * @returns Object with city, state, zipcode, and cleanAddress
 */
export function extractStateAndZipcode(address: string): { city: string; state: string; zipcode: string; cleanAddress: string } {
    if (!address || typeof address !== 'string') {
        return { city: '', state: '', zipcode: '', cleanAddress: address || '' };
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

    let city = '';
    let state = '';
    let zipcode = '';
    let cleanAddress = normalizedAddress;

    // Pattern 1: Smarty format - "Street, City, STATE ZIPCODE"
    // Example: "123 Main St, Springfield, KY 40069"
    const smartyPattern = /^(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/;
    const smartyMatch = normalizedAddress.match(smartyPattern);
    
    if (smartyMatch) {
        const [, streetPart, cityPart, stateMatch, zipcodeMatch] = smartyMatch;
        if (stateAbbreviations.includes(stateMatch)) {
            cleanAddress = streetPart.trim();
            city = cityPart.trim();
            state = stateMatch;
            zipcode = zipcodeMatch;
            return { city, state, zipcode, cleanAddress };
        }
    }

    // Pattern 2: State and zipcode at the end with various separators
    // Example: "123 Main St Springfield KY 40069" or "123 Main St, Springfield, KY 40069"
    const pattern2 = /^(.+?),?\s+([^,]+?),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/;
    const match2 = normalizedAddress.match(pattern2);
    
    if (match2) {
        const [, streetPart, cityPart, stateMatch, zipcodeMatch] = match2;
        if (stateAbbreviations.includes(stateMatch)) {
            cleanAddress = streetPart.trim();
            city = cityPart.trim();
            state = stateMatch;
            zipcode = zipcodeMatch;
            return { city, state, zipcode, cleanAddress };
        }
    }

    // Pattern 3: Zipcode only at the end (extract state and city separately)
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
            
            // Extract city - it's between the street address and the state
            const beforeState = beforeZipcode.substring(0, stateMatch.index).trim();
            const parts = beforeState.split(',').map(p => p.trim()).filter(p => p);
            
            if (parts.length >= 2) {
                cleanAddress = parts[0];
                city = parts[parts.length - 1];
            } else if (parts.length === 1) {
                // Try to split by spaces if no comma
                const spaceParts = parts[0].split(/\s+/);
                if (spaceParts.length > 3) {
                    // Assume last word before state is city
                    city = spaceParts[spaceParts.length - 1];
                    cleanAddress = spaceParts.slice(0, -1).join(' ');
                } else {
                    cleanAddress = parts[0];
                }
            }
        } else {
            // Just remove zipcode
            cleanAddress = beforeZipcode.trim();
            cleanAddress = cleanAddress.replace(/,\s*$/, '').trim();
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

    return { city, state, zipcode, cleanAddress };
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

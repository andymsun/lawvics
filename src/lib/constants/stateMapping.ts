import { StateCode } from '@/types/statute';

/**
 * FIPS State Codes to 2-letter State Code mapping.
 * Used by the US Atlas TopoJSON (us-atlas@3/states-10m.json)
 * which uses FIPS codes as geo.id.
 */
export const FIPS_TO_STATE_CODE: Record<string, StateCode> = {
    '01': 'AL', // Alabama
    '02': 'AK', // Alaska
    '04': 'AZ', // Arizona
    '05': 'AR', // Arkansas
    '06': 'CA', // California
    '08': 'CO', // Colorado
    '09': 'CT', // Connecticut
    '10': 'DE', // Delaware
    '12': 'FL', // Florida
    '13': 'GA', // Georgia
    '15': 'HI', // Hawaii
    '16': 'ID', // Idaho
    '17': 'IL', // Illinois
    '18': 'IN', // Indiana
    '19': 'IA', // Iowa
    '20': 'KS', // Kansas
    '21': 'KY', // Kentucky
    '22': 'LA', // Louisiana
    '23': 'ME', // Maine
    '24': 'MD', // Maryland
    '25': 'MA', // Massachusetts
    '26': 'MI', // Michigan
    '27': 'MN', // Minnesota
    '28': 'MS', // Mississippi
    '29': 'MO', // Missouri
    '30': 'MT', // Montana
    '31': 'NE', // Nebraska
    '32': 'NV', // Nevada
    '33': 'NH', // New Hampshire
    '34': 'NJ', // New Jersey
    '35': 'NM', // New Mexico
    '36': 'NY', // New York
    '37': 'NC', // North Carolina
    '38': 'ND', // North Dakota
    '39': 'OH', // Ohio
    '40': 'OK', // Oklahoma
    '41': 'OR', // Oregon
    '42': 'PA', // Pennsylvania
    '44': 'RI', // Rhode Island
    '45': 'SC', // South Carolina
    '46': 'SD', // South Dakota
    '47': 'TN', // Tennessee
    '48': 'TX', // Texas
    '49': 'UT', // Utah
    '50': 'VT', // Vermont
    '51': 'VA', // Virginia
    '53': 'WA', // Washington
    '54': 'WV', // West Virginia
    '55': 'WI', // Wisconsin
    '56': 'WY', // Wyoming
};

/**
 * State names to 2-letter code (fallback for property name matching)
 */
export const STATE_NAME_TO_CODE: Record<string, StateCode> = {
    'Alabama': 'AL',
    'Alaska': 'AK',
    'Arizona': 'AZ',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Pennsylvania': 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virginia': 'VA',
    'Washington': 'WA',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY',
};

/**
 * Normalized (lowercase, trimmed) state name map for robust matching
 */
const STATE_NAME_NORMALIZED: Record<string, StateCode> = Object.fromEntries(
    Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [name.toLowerCase().trim(), code])
);

/**
 * Get StateCode from a GeoJSON feature's id or properties
 */
export function getStateCodeFromGeo(geo: { id?: string; properties?: { name?: string } }): StateCode | null {
    // Try FIPS code first (geo.id)
    if (geo.id) {
        const fipsCode = String(geo.id).padStart(2, '0');
        if (fipsCode in FIPS_TO_STATE_CODE) {
            return FIPS_TO_STATE_CODE[fipsCode];
        }
    }

    // Fallback to state name (exact match)
    if (geo.properties?.name) {
        const name = geo.properties.name;
        if (name in STATE_NAME_TO_CODE) {
            return STATE_NAME_TO_CODE[name];
        }

        // Fallback to normalized name (lowercase/trimmed)
        const normalizedName = name.toLowerCase().trim();
        if (normalizedName in STATE_NAME_NORMALIZED) {
            return STATE_NAME_NORMALIZED[normalizedName];
        }
    }

    // Debug log for unmatched geometries (dev only)
    if (process.env.NODE_ENV === 'development') {
        console.warn('[Map Warning] Could not map geo id:', geo.id, 'name:', geo.properties?.name);
    }

    return null;
}


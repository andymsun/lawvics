import { StateCode } from '@/types/statute';

/**
 * US State with legal system metadata
 */
export interface USState {
    /** 2-letter state code */
    code: StateCode;
    /** Full state name */
    name: string;
    /** Legal terminology/code names specific to this state */
    terms: string[];
}

/**
 * All 50 US States with their legal terminology
 */
export const US_STATES: readonly USState[] = [
    { code: 'AL', name: 'Alabama', terms: ['Code of Alabama'] },
    { code: 'AK', name: 'Alaska', terms: ['Alaska Statutes'] },
    { code: 'AZ', name: 'Arizona', terms: ['Arizona Revised Statutes'] },
    { code: 'AR', name: 'Arkansas', terms: ['Arkansas Code'] },
    { code: 'CA', name: 'California', terms: ['California Codes', 'Civil Code', 'Penal Code'] },
    { code: 'CO', name: 'Colorado', terms: ['Colorado Revised Statutes'] },
    { code: 'CT', name: 'Connecticut', terms: ['Connecticut General Statutes'] },
    { code: 'DE', name: 'Delaware', terms: ['Delaware Code'] },
    { code: 'FL', name: 'Florida', terms: ['Florida Statutes'] },
    { code: 'GA', name: 'Georgia', terms: ['Official Code of Georgia'] },
    { code: 'HI', name: 'Hawaii', terms: ['Hawaii Revised Statutes'] },
    { code: 'ID', name: 'Idaho', terms: ['Idaho Code'] },
    { code: 'IL', name: 'Illinois', terms: ['Illinois Compiled Statutes'] },
    { code: 'IN', name: 'Indiana', terms: ['Indiana Code'] },
    { code: 'IA', name: 'Iowa', terms: ['Iowa Code'] },
    { code: 'KS', name: 'Kansas', terms: ['Kansas Statutes'] },
    { code: 'KY', name: 'Kentucky', terms: ['Kentucky Revised Statutes'] },
    { code: 'LA', name: 'Louisiana', terms: ['Louisiana Civil Code', 'Liberative Prescription'] },
    { code: 'ME', name: 'Maine', terms: ['Maine Revised Statutes'] },
    { code: 'MD', name: 'Maryland', terms: ['Maryland Code'] },
    { code: 'MA', name: 'Massachusetts', terms: ['Massachusetts General Laws'] },
    { code: 'MI', name: 'Michigan', terms: ['Michigan Compiled Laws'] },
    { code: 'MN', name: 'Minnesota', terms: ['Minnesota Statutes'] },
    { code: 'MS', name: 'Mississippi', terms: ['Mississippi Code'] },
    { code: 'MO', name: 'Missouri', terms: ['Missouri Revised Statutes'] },
    { code: 'MT', name: 'Montana', terms: ['Montana Code'] },
    { code: 'NE', name: 'Nebraska', terms: ['Nebraska Revised Statutes'] },
    { code: 'NV', name: 'Nevada', terms: ['Nevada Revised Statutes'] },
    { code: 'NH', name: 'New Hampshire', terms: ['New Hampshire Revised Statutes'] },
    { code: 'NJ', name: 'New Jersey', terms: ['New Jersey Statutes'] },
    { code: 'NM', name: 'New Mexico', terms: ['New Mexico Statutes'] },
    { code: 'NY', name: 'New York', terms: ['Consolidated Laws', 'CPLR'] },
    { code: 'NC', name: 'North Carolina', terms: ['North Carolina General Statutes'] },
    { code: 'ND', name: 'North Dakota', terms: ['North Dakota Century Code'] },
    { code: 'OH', name: 'Ohio', terms: ['Ohio Revised Code'] },
    { code: 'OK', name: 'Oklahoma', terms: ['Oklahoma Statutes'] },
    { code: 'OR', name: 'Oregon', terms: ['Oregon Revised Statutes'] },
    { code: 'PA', name: 'Pennsylvania', terms: ['Pennsylvania Consolidated Statutes'] },
    { code: 'RI', name: 'Rhode Island', terms: ['Rhode Island General Laws'] },
    { code: 'SC', name: 'South Carolina', terms: ['South Carolina Code of Laws'] },
    { code: 'SD', name: 'South Dakota', terms: ['South Dakota Codified Laws'] },
    { code: 'TN', name: 'Tennessee', terms: ['Tennessee Code'] },
    { code: 'TX', name: 'Texas', terms: ['Texas Statutes', 'Texas Civil Practice'] },
    { code: 'UT', name: 'Utah', terms: ['Utah Code'] },
    { code: 'VT', name: 'Vermont', terms: ['Vermont Statutes'] },
    { code: 'VA', name: 'Virginia', terms: ['Code of Virginia'] },
    { code: 'WA', name: 'Washington', terms: ['Revised Code of Washington'] },
    { code: 'WV', name: 'West Virginia', terms: ['West Virginia Code'] },
    { code: 'WI', name: 'Wisconsin', terms: ['Wisconsin Statutes'] },
    { code: 'WY', name: 'Wyoming', terms: ['Wyoming Statutes'] },
] as const;

/**
 * Get a US State by its code
 */
export function getStateByCode(code: StateCode): USState | undefined {
    return US_STATES.find((s) => s.code === code);
}

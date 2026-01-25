/**
 * Demo Statute Data
 * 
 * This file contains researched, accurate legal data for demonstration purposes.
 * Data sources: Nolo.com, Justia.com, Alta.org, WorldPopulationReview.com, and state legislature websites.
 * Last updated: January 2025
 * 
 * DISCLAIMER: This data is for demonstration purposes only and should not be used as legal advice.
 * Laws change frequently. Always consult current state statutes and legal professionals.
 */

import { StateCode, Statute } from '@/types/statute';

// =============================================================================
// Types
// =============================================================================

export type DemoQuery = 'adverse_possession' | 'fraud_sol' | 'gta_threshold';

interface DemoStatuteData {
    citation: string;
    textSnippet: string;
    effectiveDate: string;
    confidenceScore: number;
    sourceUrl: string;
    trustLevel?: 'verified' | 'unverified' | 'suspicious';
}



// =============================================================================
// ADVERSE POSSESSION TIME LIMITS
// Sources: Nolo.com, Justia.com, Alta.org, state legislature websites
// =============================================================================

const ADVERSE_POSSESSION_DATA: Partial<Record<StateCode, DemoStatuteData>> = {
    AL: {
        citation: 'Ala. Code § 6-5-200',
        textSnippet: 'Alabama requires 10 years of adverse possession with a deed or payment of taxes, or 20 years by prescription without color of title.',
        effectiveDate: '2024-01-07',
        confidenceScore: 95,
        sourceUrl: 'https://alison.legislature.state.al.us/',
    },
    AK: {
        citation: 'Alaska Stat. § 09.10.030',
        textSnippet: 'Alaska requires 10 years of continuous adverse possession, or 7 years with a deed (color of title).',
        effectiveDate: '2021-05-15',
        confidenceScore: 94,
        sourceUrl: 'https://www.akleg.gov/',
    },
    AZ: {
        citation: 'Ariz. Rev. Stat. § 12-526',
        textSnippet: 'Arizona requires 10 years of adverse possession, 5 years with a deed and payment of taxes for city lots, or 3 years with a deed and taxes.',
        effectiveDate: '2024-11-29',
        confidenceScore: 95,
        sourceUrl: 'https://www.azleg.gov/',
    },
    AR: {
        citation: 'Ark. Code § 18-11-106',
        textSnippet: 'Arkansas requires 7 years of adverse possession with a deed or color of title and payment of taxes, or 15 years for wild and unimproved land with payment of taxes.',
        effectiveDate: '2023-01-14',
        confidenceScore: 94,
        sourceUrl: 'https://www.arkleg.state.ar.us/',
    },
    CA: {
        citation: 'Cal. Civ. Proc. Code § 325',
        textSnippet: 'California requires 5 years of continuous adverse possession with a deed, judgment, or decree, plus payment of all property taxes during that period.',
        effectiveDate: '2023-12-19',
        confidenceScore: 96,
        sourceUrl: 'https://leginfo.legislature.ca.gov/',
    },
    CO: {
        citation: 'Colo. Rev. Stat. § 38-41-101',
        textSnippet: 'Colorado requires 18 years of adverse possession, or 7 years with a deed and payment of taxes.',
        effectiveDate: '2021-05-21',
        confidenceScore: 95,
        sourceUrl: 'https://leg.colorado.gov/',
    },
    CT: {
        citation: 'Conn. Gen. Stat. § 52-575',
        textSnippet: 'Connecticut requires 15 years of continuous adverse possession.',
        effectiveDate: '2024-04-14',
        confidenceScore: 94,
        sourceUrl: 'https://www.cga.ct.gov/',
    },
    // DE: Missing for demo error simulation
    FL: {
        citation: 'Fla. Stat. § 95.18',
        textSnippet: 'Florida requires 7 years of adverse possession with color of title and payment of all taxes.',
        effectiveDate: '2024-05-08',
        confidenceScore: 95,
        sourceUrl: 'http://www.leg.state.fl.us/',
    },
    GA: {
        citation: 'Ga. Code § 44-5-161',
        textSnippet: 'Georgia requires 20 years of adverse possession, or 7 years with color of title.',
        effectiveDate: '2021-10-05',
        confidenceScore: 94,
        sourceUrl: 'https://www.legis.ga.gov/',
    },
    // HI: Missing for demo error simulation
    ID: {
        citation: 'Idaho Code § 5-210',
        textSnippet: 'Idaho requires 20 years of adverse possession with payment of taxes.',
        effectiveDate: '2022-05-30',
        confidenceScore: 94,
        sourceUrl: 'https://legislature.idaho.gov/',
    },
    IL: {
        citation: '735 ILCS 5/13-101',
        textSnippet: 'Illinois requires 20 years of adverse possession, 7 years with a deed or payment of taxes, or 2 years if title is obtained via foreclosure.',
        effectiveDate: '2020-10-23',
        confidenceScore: 95,
        sourceUrl: 'https://www.ilga.gov/',
    },
    IN: {
        citation: 'Ind. Code § 32-21-7-1',
        textSnippet: 'Indiana requires 10 years of adverse possession with payment of taxes.',
        effectiveDate: '2024-04-21',
        confidenceScore: 94,
        sourceUrl: 'https://iga.in.gov/',
    },
    IA: {
        citation: 'Iowa Code § 614.17A',
        textSnippet: 'Iowa requires 10 years of continuous adverse possession.',
        effectiveDate: '2022-03-05',
        confidenceScore: 93,
        sourceUrl: 'https://www.legis.iowa.gov/',
    },
    KS: {
        citation: 'Kan. Stat. § 60-503',
        textSnippet: 'Kansas requires 15 years of adverse possession.',
        effectiveDate: '2021-12-02',
        confidenceScore: 94,
        sourceUrl: 'https://www.kslegislature.org/',
    },
    KY: {
        citation: 'Ky. Rev. Stat. § 413.010',
        textSnippet: 'Kentucky requires 15 years of adverse possession, or 7 years with a deed.',
        effectiveDate: '2019-01-22',
        confidenceScore: 94,
        sourceUrl: 'https://legislature.ky.gov/',
    },
    LA: {
        citation: 'La. Civ. Code art. 3473',
        textSnippet: 'Louisiana requires 30 years of adverse possession, or 10 years with a deed (good faith possession).',
        effectiveDate: '2022-12-04',
        confidenceScore: 95,
        sourceUrl: 'https://legis.la.gov/',
    },
    ME: {
        citation: 'Me. Rev. Stat. tit. 14, § 801',
        textSnippet: 'Maine requires 20 years of adverse possession.',
        effectiveDate: '2018-03-30',
        confidenceScore: 93,
        sourceUrl: 'https://legislature.maine.gov/',
    },
    MD: {
        citation: 'Md. Code, Cts. & Jud. Proc. § 5-103',
        textSnippet: 'Maryland requires 20 years of adverse possession.',
        effectiveDate: '2022-01-12',
        confidenceScore: 94,
        sourceUrl: 'https://mgaleg.maryland.gov/',
    },
    MA: {
        citation: 'Mass. Gen. Laws ch. 260, § 21',
        textSnippet: 'Massachusetts requires 20 years of adverse possession.',
        effectiveDate: '2019-03-06',
        confidenceScore: 94,
        sourceUrl: 'https://malegislature.gov/',
    },
    MI: {
        citation: 'Mich. Comp. Laws § 600.5801',
        textSnippet: 'Michigan requires 15 years of adverse possession.',
        effectiveDate: '2021-09-28',
        confidenceScore: 94,
        sourceUrl: 'https://www.legislature.mi.gov/',
    },
    MN: {
        citation: 'Minn. Stat. § 541.02',
        textSnippet: 'Minnesota requires 15 years of adverse possession with payment of taxes.',
        effectiveDate: '2018-11-25',
        confidenceScore: 94,
        sourceUrl: 'https://www.revisor.mn.gov/',
    },
    MS: {
        citation: 'Miss. Code § 15-1-13',
        textSnippet: 'Mississippi requires 10 years of adverse possession.',
        effectiveDate: '2022-01-27',
        confidenceScore: 94,
        sourceUrl: 'http://www.legislature.ms.gov/',
    },
    MO: {
        citation: 'Mo. Rev. Stat. § 516.010',
        textSnippet: 'Missouri requires 10 years of adverse possession.',
        effectiveDate: '2018-10-29',
        confidenceScore: 94,
        sourceUrl: 'https://www.house.mo.gov/',
    },
    MT: {
        citation: 'Mont. Code § 70-19-411',
        textSnippet: 'Montana requires 5 years of adverse possession with payment of taxes.',
        effectiveDate: '2022-06-26',
        confidenceScore: 95,
        sourceUrl: 'https://leg.mt.gov/',
    },
    NE: {
        citation: 'Neb. Rev. Stat. § 25-202',
        textSnippet: 'Nebraska requires 10 years of adverse possession.',
        effectiveDate: '2019-08-17',
        confidenceScore: 80,
        sourceUrl: 'https://www.nolo.com/legal-encyclopedia/nebraska-adverse-possession-laws.html',
    },
    NV: {
        citation: 'Nev. Rev. Stat. § 11.070',
        textSnippet: 'Nevada requires 15 years of adverse possession with payment of taxes, or 5 years with a deed or payment of taxes.',
        effectiveDate: '2022-02-17',
        confidenceScore: 94,
        sourceUrl: 'https://www.leg.state.nv.us/',
    },
    NH: {
        citation: 'N.H. Rev. Stat. § 508:2',
        textSnippet: 'New Hampshire requires 20 years of adverse possession.',
        effectiveDate: '2018-09-06',
        confidenceScore: 93,
        sourceUrl: 'http://www.gencourt.state.nh.us/',
    },
    NJ: {
        citation: 'N.J. Stat. § 2A:14-30',
        textSnippet: 'New Jersey requires 30 years of adverse possession, or 60 years for woodlands or uncultivated tracts—the longest in the nation.',
        effectiveDate: '2021-01-22',
        confidenceScore: 65,
        sourceUrl: 'https://www.njleg.state.nj.us/',
        trustLevel: 'suspicious',
    },
    NM: {
        citation: 'N.M. Stat. § 37-1-22',
        textSnippet: 'New Mexico requires 10 years of adverse possession with a deed and payment of taxes.',
        effectiveDate: '2021-12-29',
        confidenceScore: 94,
        sourceUrl: 'https://www.nmlegis.gov/',
    },
    NY: {
        citation: 'N.Y. Real Prop. Acts. Law § 501',
        textSnippet: 'New York requires 10 years of adverse possession under claim of right.',
        effectiveDate: '2024-11-17',
        confidenceScore: 95,
        sourceUrl: 'https://www.nysenate.gov/',
    },
    NC: {
        citation: 'N.C. Gen. Stat. § 1-40',
        textSnippet: 'North Carolina requires 20 years of adverse possession, or 7 years with color of title.',
        effectiveDate: '2019-10-30',
        confidenceScore: 94,
        sourceUrl: 'https://www.ncleg.gov/',
    },
    ND: {
        citation: 'N.D. Cent. Code § 28-01-04',
        textSnippet: 'North Dakota requires 20 years of adverse possession, or 10 years with a deed and payment of taxes.',
        effectiveDate: '2024-05-06',
        confidenceScore: 80,
        sourceUrl: 'https://www.nolo.com/legal-encyclopedia/north-dakota-adverse-possession-laws.html',
    },
    OH: {
        citation: 'Ohio Rev. Code § 2305.04',
        textSnippet: 'Ohio requires 21 years of adverse possession.',
        effectiveDate: '2023-09-25',
        confidenceScore: 94,
        sourceUrl: 'https://www.legislature.ohio.gov/',
    },
    OK: {
        citation: 'Okla. Stat. tit. 12, § 93',
        textSnippet: 'Oklahoma requires 15 years of adverse possession.',
        effectiveDate: '2024-12-26',
        confidenceScore: 94,
        sourceUrl: 'https://www.oklegislature.gov/',
    },
    OR: {
        citation: 'Or. Rev. Stat. § 105.620',
        textSnippet: 'Oregon requires 10 years of adverse possession.',
        effectiveDate: '2020-03-08',
        confidenceScore: 94,
        sourceUrl: 'https://www.oregonlegislature.gov/',
    },
    PA: {
        citation: '42 Pa. Cons. Stat. § 5530',
        textSnippet: 'Pennsylvania requires 21 years of adverse possession, except 10 years for single-family homes on parcels less than 0.5 acres.',
        effectiveDate: '2020-08-08',
        confidenceScore: 94,
        sourceUrl: 'https://www.legis.state.pa.us/',
    },
    RI: {
        citation: 'R.I. Gen. Laws § 34-7-1',
        textSnippet: 'Rhode Island requires 10 years of adverse possession.',
        effectiveDate: '2020-07-04',
        confidenceScore: 94,
        sourceUrl: 'http://www.rilegislature.gov/',
    },
    SC: {
        citation: 'S.C. Code § 15-67-210',
        textSnippet: 'South Carolina requires 10 years of adverse possession.',
        effectiveDate: '2023-06-17',
        confidenceScore: 94,
        sourceUrl: 'https://www.scstatehouse.gov/',
    },
    SD: {
        citation: 'S.D. Codified Laws § 15-3-1',
        textSnippet: 'South Dakota requires 20 years of adverse possession, or 10 years with payment of taxes and a deed.',
        effectiveDate: '2024-09-13',
        confidenceScore: 60,
        sourceUrl: 'https://sdlegislature.gov/',
        trustLevel: 'suspicious',
    },
    TN: {
        citation: 'Tenn. Code § 28-2-101',
        textSnippet: 'Tennessee requires 7 years of adverse possession with a deed, or 20 years without a deed or with payment of taxes.',
        effectiveDate: '2024-02-24',
        confidenceScore: 94,
        sourceUrl: 'https://www.capitol.tn.gov/',
    },
    TX: {
        citation: 'Tex. Civ. Prac. & Rem. Code § 16.021',
        textSnippet: 'Texas requires 10 years of adverse possession, 5 years with a deed and payment of taxes, or 3 years with color of title.',
        effectiveDate: '2023-06-27',
        confidenceScore: 95,
        sourceUrl: 'https://capitol.texas.gov/',
    },
    UT: {
        citation: 'Utah Code § 78B-2-208',
        textSnippet: 'Utah requires 7 years of adverse possession with a decree or judgment plus payment of taxes, or 20 years with enclosure, improvement, or irrigation system.',
        effectiveDate: '2019-10-08',
        confidenceScore: 94,
        sourceUrl: 'https://le.utah.gov/',
    },
    VT: {
        citation: 'Vt. Stat. tit. 12, § 501',
        textSnippet: 'Vermont requires 15 years of adverse possession.',
        effectiveDate: '2019-10-23',
        confidenceScore: 94,
        sourceUrl: 'https://legislature.vermont.gov/',
    },
    VA: {
        citation: 'Va. Code § 8.01-236',
        textSnippet: 'Virginia requires 15 years of adverse possession.',
        effectiveDate: '2022-01-19',
        confidenceScore: 94,
        sourceUrl: 'https://virginiageneralassembly.gov/',
    },
    WA: {
        citation: 'Wash. Rev. Code § 7.28.070',
        textSnippet: 'Washington requires 10 years of adverse possession, or 7 years with a deed or payment of taxes.',
        effectiveDate: '2019-08-07',
        confidenceScore: 94,
        sourceUrl: 'https://leg.wa.gov/',
    },
    WV: {
        citation: 'W. Va. Code § 55-2-1',
        textSnippet: 'West Virginia requires 10 years of adverse possession.',
        effectiveDate: '2019-12-22',
        confidenceScore: 94,
        sourceUrl: 'https://www.wvlegislature.gov/',
    },
    WI: {
        citation: 'Wis. Stat. § 893.25',
        textSnippet: 'Wisconsin requires 20 years of adverse possession, 10 years with a deed, or 7 years with a deed and payment of taxes.',
        effectiveDate: '2020-02-08',
        confidenceScore: 94,
        sourceUrl: 'https://legis.wisconsin.gov/',
    },
    WY: {
        citation: 'Wyo. Stat. § 1-3-103',
        textSnippet: 'Wyoming requires 10 years of adverse possession.',
        effectiveDate: '2023-05-04',
        confidenceScore: 94,
        sourceUrl: 'https://www.wyoleg.gov/',
    },
};

// =============================================================================
// FRAUD STATUTE OF LIMITATIONS (CIVIL)
// Sources: Justia.com, Nolo.com, state legislature websites
// =============================================================================

const FRAUD_SOL_DATA: Partial<Record<StateCode, DemoStatuteData>> = {
    AL: {
        citation: 'Ala. Code § 6-2-3',
        textSnippet: 'The statute of limitations for civil fraud in Alabama is 2 years from discovery of the fraud.',
        effectiveDate: '2021-03-15',
        confidenceScore: 95,
        sourceUrl: 'https://alison.legislature.state.al.us/',
    },
    // AK: Missing for demo error simulation
    AZ: {
        citation: 'Ariz. Rev. Stat. § 12-543',
        textSnippet: 'Arizona statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2022-10-22',
        confidenceScore: 95,
        sourceUrl: 'https://www.azleg.gov/',
    },
    AR: {
        citation: 'Ark. Code § 16-56-105',
        textSnippet: 'Arkansas statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2024-05-11',
        confidenceScore: 94,
        sourceUrl: 'https://www.arkleg.state.ar.us/',
    },
    CA: {
        citation: 'Cal. Civ. Proc. Code § 338(d)',
        textSnippet: 'California statute of limitations for fraud is 3 years from discovery of facts constituting the fraud, not from the date of the fraudulent act.',
        effectiveDate: '2018-10-28',
        confidenceScore: 96,
        sourceUrl: 'https://leginfo.legislature.ca.gov/',
    },
    CO: {
        citation: 'Colo. Rev. Stat. § 13-80-101',
        textSnippet: 'Colorado statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2022-09-13',
        confidenceScore: 95,
        sourceUrl: 'https://leg.colorado.gov/',
    },
    CT: {
        citation: 'Conn. Gen. Stat. § 52-577',
        textSnippet: 'Connecticut statute of limitations for fraud is 3 years from the act or omission complained of.',
        effectiveDate: '2018-05-09',
        confidenceScore: 94,
        sourceUrl: 'https://www.cga.ct.gov/',
    },
    DE: {
        citation: 'Del. Code tit. 10, § 8106',
        textSnippet: 'Delaware statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2018-12-23',
        confidenceScore: 93,
        sourceUrl: 'https://legis.delaware.gov/',
    },
    FL: {
        citation: 'Fla. Stat. § 95.031',
        textSnippet: 'Florida statute of limitations for fraud is 4 years from discovery, with a maximum of 12 years from the date of the fraud.',
        effectiveDate: '2024-12-15',
        confidenceScore: 68,
        sourceUrl: 'http://www.leg.state.fl.us/',
        trustLevel: 'suspicious',
    },
    GA: {
        citation: 'Ga. Code § 9-3-31',
        textSnippet: 'Georgia statute of limitations for fraud is 4 years from discovery.',
        effectiveDate: '2018-05-21',
        confidenceScore: 94,
        sourceUrl: 'https://www.legis.ga.gov/',
    },
    HI: {
        citation: 'Haw. Rev. Stat. § 657-1',
        textSnippet: 'Hawaii statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2021-11-17',
        confidenceScore: 93,
        sourceUrl: 'https://www.capitol.hawaii.gov/',
    },
    ID: {
        citation: 'Idaho Code § 5-218',
        textSnippet: 'Idaho statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2020-09-24',
        confidenceScore: 94,
        sourceUrl: 'https://legislature.idaho.gov/',
    },
    IL: {
        citation: '735 ILCS 5/13-205',
        textSnippet: 'Illinois statute of limitations for common law fraud is 5 years from discovery. Consumer fraud has a 3-year limit.',
        effectiveDate: '2024-10-27',
        confidenceScore: 95,
        sourceUrl: 'https://www.ilga.gov/',
    },
    IN: {
        citation: 'Ind. Code § 34-11-2-7',
        textSnippet: 'Indiana statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2023-01-27',
        confidenceScore: 94,
        sourceUrl: 'https://iga.in.gov/',
    },
    IA: {
        citation: 'Iowa Code § 614.1',
        textSnippet: 'Iowa statute of limitations for fraud is 5 years from discovery.',
        effectiveDate: '2021-11-17',
        confidenceScore: 93,
        sourceUrl: 'https://www.legis.iowa.gov/',
    },
    KS: {
        citation: 'Kan. Stat. § 60-513',
        textSnippet: 'Kansas statute of limitations for fraud is 2 years from discovery.',
        effectiveDate: '2019-02-13',
        confidenceScore: 94,
        sourceUrl: 'https://www.kslegislature.org/',
    },
    KY: {
        citation: 'Ky. Rev. Stat. § 413.120',
        textSnippet: 'Kentucky statute of limitations for fraud is 5 years from discovery.',
        effectiveDate: '2023-05-17',
        confidenceScore: 94,
        sourceUrl: 'https://legislature.ky.gov/',
    },
    LA: {
        citation: 'La. Civ. Code art. 3492',
        textSnippet: 'Louisiana statute of limitations for fraud is 1 year from discovery—the shortest in the nation.',
        effectiveDate: '2020-06-01',
        confidenceScore: 95,
        sourceUrl: 'https://legis.la.gov/',
    },
    ME: {
        citation: 'Me. Rev. Stat. tit. 14, § 859',
        textSnippet: 'Maine statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2022-11-28',
        confidenceScore: 75,
        sourceUrl: 'https://www.justia.com/marketing/directory/maine/fraud/',
    },
    MD: {
        citation: 'Md. Code, Cts. & Jud. Proc. § 5-101',
        textSnippet: 'Maryland statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2024-05-18',
        confidenceScore: 94,
        sourceUrl: 'https://mgaleg.maryland.gov/',
    },
    MA: {
        citation: 'Mass. Gen. Laws ch. 260, § 2A',
        textSnippet: 'Massachusetts statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2021-10-08',
        confidenceScore: 78,
        sourceUrl: 'https://www.justia.com/marketing/directory/massachusetts/fraud/',
    },
    MI: {
        citation: 'Mich. Comp. Laws § 600.5813',
        textSnippet: 'Michigan statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2018-08-11',
        confidenceScore: 94,
        sourceUrl: 'https://www.legislature.mi.gov/',
    },
    MN: {
        citation: 'Minn. Stat. § 541.05',
        textSnippet: 'Minnesota statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2021-01-29',
        confidenceScore: 94,
        sourceUrl: 'https://www.revisor.mn.gov/',
    },
    MS: {
        citation: 'Miss. Code § 15-1-49',
        textSnippet: 'Mississippi statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2022-05-06',
        confidenceScore: 94,
        sourceUrl: 'http://www.legislature.ms.gov/',
    },
    MO: {
        citation: 'Mo. Rev. Stat. § 516.120',
        textSnippet: 'Missouri statute of limitations for fraud is 5 years from discovery.',
        effectiveDate: '2024-10-01',
        confidenceScore: 94,
        sourceUrl: 'https://www.house.mo.gov/',
    },
    MT: {
        citation: 'Mont. Code § 27-2-203',
        textSnippet: 'Montana statute of limitations for fraud is 2 years from discovery.',
        effectiveDate: '2019-07-07',
        confidenceScore: 95,
        sourceUrl: 'https://leg.mt.gov/',
    },
    NE: {
        citation: 'Neb. Rev. Stat. § 25-207',
        textSnippet: 'Nebraska statute of limitations for fraud is 4 years from discovery.',
        effectiveDate: '2018-06-14',
        confidenceScore: 94,
        sourceUrl: 'https://nebraskalegislature.gov/',
    },
    NV: {
        citation: 'Nev. Rev. Stat. § 11.190',
        textSnippet: 'Nevada statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2018-01-07',
        confidenceScore: 62,
        sourceUrl: 'https://www.leg.state.nv.us/',
        trustLevel: 'suspicious',
    },
    NH: {
        citation: 'N.H. Rev. Stat. § 508:4',
        textSnippet: 'New Hampshire statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2024-08-20',
        confidenceScore: 75,
        sourceUrl: 'https://www.justia.com/marketing/directory/new-hampshire/fraud/',
    },
    NJ: {
        citation: 'N.J. Stat. § 2A:14-1.2',
        textSnippet: 'New Jersey statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2021-02-08',
        confidenceScore: 95,
        sourceUrl: 'https://www.njleg.state.nj.us/',
    },
    NM: {
        citation: 'N.M. Stat. § 37-1-4',
        textSnippet: 'New Mexico statute of limitations for fraud is 4 years from discovery.',
        effectiveDate: '2019-07-19',
        confidenceScore: 94,
        sourceUrl: 'https://www.nmlegis.gov/',
    },
    NY: {
        citation: 'N.Y. C.P.L.R. § 213(8)',
        textSnippet: 'New York statute of limitations for fraud is 6 years from occurrence, or 2 years from discovery, whichever is later.',
        effectiveDate: '2019-10-14',
        confidenceScore: 95,
        sourceUrl: 'https://www.nysenate.gov/',
    },
    NC: {
        citation: 'N.C. Gen. Stat. § 1-52(9)',
        textSnippet: 'North Carolina statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2024-07-15',
        confidenceScore: 94,
        sourceUrl: 'https://www.ncleg.gov/',
    },
    ND: {
        citation: 'N.D. Cent. Code § 28-01-16',
        textSnippet: 'North Dakota statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2019-08-25',
        confidenceScore: 93,
        sourceUrl: 'https://www.ndlegis.gov/',
    },
    OH: {
        citation: 'Ohio Rev. Code § 2305.09',
        textSnippet: 'Ohio statute of limitations for fraud is 4 years from discovery.',
        effectiveDate: '2018-04-23',
        confidenceScore: 94,
        sourceUrl: 'https://www.legislature.ohio.gov/',
    },
    OK: {
        citation: 'Okla. Stat. tit. 12, § 95',
        textSnippet: 'Oklahoma statute of limitations for fraud is 2 years from discovery.',
        effectiveDate: '2022-03-26',
        confidenceScore: 94,
        sourceUrl: 'https://www.oklegislature.gov/',
    },
    OR: {
        citation: 'Or. Rev. Stat. § 12.110',
        textSnippet: 'Oregon statute of limitations for fraud is 2 years from discovery.',
        effectiveDate: '2020-10-27',
        confidenceScore: 94,
        sourceUrl: 'https://www.oregonlegislature.gov/',
    },
    PA: {
        citation: '42 Pa. Cons. Stat. § 5524',
        textSnippet: 'Pennsylvania statute of limitations for fraud is 2 years from discovery.',
        effectiveDate: '2021-01-10',
        confidenceScore: 94,
        sourceUrl: 'https://www.legis.state.pa.us/',
    },
    RI: {
        citation: 'R.I. Gen. Laws § 9-1-14',
        textSnippet: 'Rhode Island statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2018-10-04',
        confidenceScore: 77,
        sourceUrl: 'https://www.justia.com/marketing/directory/rhode-island/fraud/',
    },
    SC: {
        citation: 'S.C. Code § 15-3-530',
        textSnippet: 'South Carolina statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2023-04-14',
        confidenceScore: 94,
        sourceUrl: 'https://www.scstatehouse.gov/',
    },
    SD: {
        citation: 'S.D. Codified Laws § 15-2-13',
        textSnippet: 'South Dakota statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2022-11-08',
        confidenceScore: 93,
        sourceUrl: 'https://sdlegislature.gov/',
    },
    TN: {
        citation: 'Tenn. Code § 28-3-105',
        textSnippet: 'Tennessee statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2018-08-05',
        confidenceScore: 94,
        sourceUrl: 'https://www.capitol.tn.gov/',
    },
    TX: {
        citation: 'Tex. Civ. Prac. & Rem. Code § 16.004',
        textSnippet: 'Texas statute of limitations for civil fraud is 4 years from discovery.',
        effectiveDate: '2018-07-20',
        confidenceScore: 95,
        sourceUrl: 'https://capitol.texas.gov/',
    },
    UT: {
        citation: 'Utah Code § 78B-2-305',
        textSnippet: 'Utah statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2020-09-23',
        confidenceScore: 94,
        sourceUrl: 'https://le.utah.gov/',
    },
    // VT: Missing for demo error simulation
    VA: {
        citation: 'Va. Code § 8.01-243',
        textSnippet: 'Virginia statute of limitations for fraud is 2 years from discovery.',
        effectiveDate: '2020-10-17',
        confidenceScore: 94,
        sourceUrl: 'https://virginiageneralassembly.gov/',
    },
    WA: {
        citation: 'Wash. Rev. Code § 4.16.080',
        textSnippet: 'Washington statute of limitations for fraud is 3 years from discovery.',
        effectiveDate: '2024-11-26',
        confidenceScore: 94,
        sourceUrl: 'https://leg.wa.gov/',
    },
    WV: {
        citation: 'W. Va. Code § 55-2-12',
        textSnippet: 'West Virginia statute of limitations for fraud is 2 years from discovery.',
        effectiveDate: '2018-09-28',
        confidenceScore: 94,
        sourceUrl: 'https://www.wvlegislature.gov/',
    },
    WI: {
        citation: 'Wis. Stat. § 893.93',
        textSnippet: 'Wisconsin statute of limitations for fraud is 6 years from discovery.',
        effectiveDate: '2020-06-13',
        confidenceScore: 94,
        sourceUrl: 'https://legis.wisconsin.gov/',
    },
    WY: {
        citation: 'Wyo. Stat. § 1-3-105',
        textSnippet: 'Wyoming statute of limitations for fraud is 4 years from discovery.',
        effectiveDate: '2022-05-06',
        confidenceScore: 94,
        sourceUrl: 'https://www.wyoleg.gov/',
    },
};

// =============================================================================
// GRAND THEFT / FELONY THEFT THRESHOLDS
// Sources: WorldPopulationReview.com, Pew Research, state legislature websites
// =============================================================================

const GTA_THRESHOLD_DATA: Partial<Record<StateCode, DemoStatuteData>> = {
    AL: {
        citation: 'Ala. Code § 13A-8-3',
        textSnippet: 'Alabama felony theft threshold is $1,500. Theft of property valued at $1,500 or more is theft of property in the first degree (Class B felony).',
        effectiveDate: '2021-06-12',
        confidenceScore: 95,
        sourceUrl: 'https://alison.legislature.state.al.us/',
    },
    AK: {
        citation: 'Alaska Stat. § 11.46.130',
        textSnippet: 'Alaska felony theft threshold is $1,000. Theft in the second degree (Class C felony) applies when property value is $1,000 or more but less than $25,000.',
        effectiveDate: '2018-01-10',
        confidenceScore: 94,
        sourceUrl: 'https://www.akleg.gov/',
    },
    AZ: {
        citation: 'Ariz. Rev. Stat. § 13-1802',
        textSnippet: 'Arizona felony theft threshold is $1,000. Theft of property valued at $1,000 or more is a Class 6 felony.',
        effectiveDate: '2018-04-17',
        confidenceScore: 95,
        sourceUrl: 'https://www.azleg.gov/',
    },
    AR: {
        citation: 'Ark. Code § 5-36-103',
        textSnippet: 'Arkansas felony theft threshold is $1,000. Theft of property valued at $1,000 or more is a Class D felony.',
        effectiveDate: '2022-05-29',
        confidenceScore: 94,
        sourceUrl: 'https://www.arkleg.state.ar.us/',
    },
    CA: {
        citation: 'Cal. Penal Code § 487',
        textSnippet: 'California grand theft threshold is $950. Grand theft applies when property value exceeds $950. Motor vehicle theft is always grand theft regardless of value.',
        effectiveDate: '2020-11-20',
        confidenceScore: 96,
        sourceUrl: 'https://leginfo.legislature.ca.gov/',
    },
    CO: {
        citation: 'Colo. Rev. Stat. § 13-80-101',
        textSnippet: 'Colorado felony theft threshold is $2,000. Theft is a Class 4 felony when property value is $2,000 or more but less than $5,000.',
        effectiveDate: '2018-12-12',
        confidenceScore: 95,
        sourceUrl: 'https://leg.colorado.gov/',
    },
    CT: {
        citation: 'Conn. Gen. Stat. § 53a-124',
        textSnippet: 'Connecticut felony theft threshold is $2,000. Larceny in the fourth degree (Class A misdemeanor elevated to felony) applies at $2,000 or more.',
        effectiveDate: '2018-09-02',
        confidenceScore: 94,
        sourceUrl: 'https://www.cga.ct.gov/',
    },
    DE: {
        citation: 'Del. Code tit. 11, § 841',
        textSnippet: 'Delaware felony theft threshold is $1,500. Theft of property valued at $1,500 or more is a Class G felony.',
        effectiveDate: '2022-08-25',
        confidenceScore: 93,
        sourceUrl: 'https://legis.delaware.gov/',
    },
    FL: {
        citation: 'Fla. Stat. § 812.014',
        textSnippet: 'Florida grand theft threshold is $750. Grand theft in the third degree applies when property value is $750 or more. Motor vehicle theft is always a felony.',
        effectiveDate: '2024-12-18',
        confidenceScore: 95,
        sourceUrl: 'http://www.leg.state.fl.us/',
    },
    GA: {
        citation: 'Ga. Code § 16-8-12',
        textSnippet: 'Georgia felony theft threshold is $1,500. Theft by taking becomes a felony when property value exceeds $1,500.',
        effectiveDate: '2024-03-05',
        confidenceScore: 94,
        sourceUrl: 'https://www.legis.ga.gov/',
    },
    HI: {
        citation: 'Haw. Rev. Stat. § 708-830.5',
        textSnippet: 'Hawaii felony theft threshold is $750. Theft in the second degree (Class C felony) applies when value exceeds $750.',
        effectiveDate: '2019-07-14',
        confidenceScore: 93,
        sourceUrl: 'https://www.capitol.hawaii.gov/',
    },
    ID: {
        citation: 'Idaho Code § 18-2407',
        textSnippet: 'Idaho grand theft threshold is $1,000. Grand theft applies when property value is $1,000 or more.',
        effectiveDate: '2018-04-06',
        confidenceScore: 94,
        sourceUrl: 'https://legislature.idaho.gov/',
    },
    IL: {
        citation: '720 ILCS 5/16-1',
        textSnippet: 'Illinois felony theft threshold is $500. Theft exceeding $500 is a Class 3 felony. Motor vehicle theft is always a Class 2 felony.',
        effectiveDate: '2023-05-22',
        confidenceScore: 95,
        sourceUrl: 'https://www.ilga.gov/',
    },
    IN: {
        citation: 'Ind. Code § 35-43-4-2',
        textSnippet: 'Indiana felony theft threshold is $750. Theft becomes a Level 6 felony when property value is $750 or more.',
        effectiveDate: '2020-04-04',
        confidenceScore: 94,
        sourceUrl: 'https://iga.in.gov/',
    },
    IA: {
        citation: 'Iowa Code § 714.2',
        textSnippet: 'Iowa felony theft threshold is $1,500. Theft in the second degree (Class D felony) applies when value exceeds $1,500.',
        effectiveDate: '2018-11-21',
        confidenceScore: 93,
        sourceUrl: 'https://www.legis.iowa.gov/',
    },
    KS: {
        citation: 'Kan. Stat. § 21-5801',
        textSnippet: 'Kansas felony theft threshold is $1,500. Theft is a severity level 9 nonperson felony when value is $1,500 or more.',
        effectiveDate: '2023-08-10',
        confidenceScore: 94,
        sourceUrl: 'https://www.kslegislature.org/',
    },
    KY: {
        citation: 'Ky. Rev. Stat. § 514.030',
        textSnippet: 'Kentucky felony theft threshold is $1,000. Theft by unlawful taking over $1,000 is a Class D felony.',
        effectiveDate: '2019-06-10',
        confidenceScore: 94,
        sourceUrl: 'https://legislature.ky.gov/',
    },
    LA: {
        citation: 'La. Rev. Stat. § 14:67',
        textSnippet: '(Potential Conflict) Louisiana felony theft threshold appears to be $1,000, but recent amendments may apply.',
        effectiveDate: '2021-12-21',
        confidenceScore: 60,
        sourceUrl: 'https://legis.la.gov/',
        trustLevel: 'suspicious',
    },
    ME: {
        citation: 'Me. Rev. Stat. tit. 17-A, § 353',
        textSnippet: 'Maine felony theft threshold is $1,000. Class C theft (felony) applies when value exceeds $1,000.',
        effectiveDate: '2024-01-14',
        confidenceScore: 93,
        sourceUrl: 'https://legislature.maine.gov/',
    },
    MD: {
        citation: 'Md. Crim. Law § 7-104',
        textSnippet: 'Maryland felony theft threshold is $1,500. Theft of property valued at $1,500 or more is a felony with up to 5 years imprisonment.',
        effectiveDate: '2018-12-20',
        confidenceScore: 94,
        sourceUrl: 'https://mgaleg.maryland.gov/',
    },
    MA: {
        citation: 'Mass. Gen. Laws ch. 266, § 30',
        textSnippet: 'Massachusetts felony larceny threshold is $1,200. Larceny of property over $1,200 is punishable by up to 5 years in state prison.',
        effectiveDate: '2018-05-10',
        confidenceScore: 94,
        sourceUrl: 'https://malegislature.gov/',
    },
    MI: {
        citation: 'Mich. Comp. Laws § 750.356',
        textSnippet: 'Michigan felony larceny threshold is $1,000. Larceny of property valued at $1,000 or more is a felony.',
        effectiveDate: '2020-02-01',
        confidenceScore: 94,
        sourceUrl: 'https://www.legislature.mi.gov/',
    },
    MN: {
        citation: 'Minn. Stat. § 609.52',
        textSnippet: 'Minnesota felony theft threshold is $1,000. Theft of property over $1,000 is a felony with up to 5 years imprisonment.',
        effectiveDate: '2021-01-29',
        confidenceScore: 94,
        sourceUrl: 'https://www.revisor.mn.gov/',
    },
    MS: {
        citation: 'Miss. Code § 97-17-41',
        textSnippet: 'Mississippi grand larceny threshold is $1,000. NOTE: Conflicting reports on whether threshold was raised to $2,000.',
        effectiveDate: '2022-05-12',
        confidenceScore: 55,
        sourceUrl: 'http://www.legislature.ms.gov/',
        trustLevel: 'suspicious',
    },
    MO: {
        citation: 'Mo. Rev. Stat. § 570.030',
        textSnippet: 'Missouri felony stealing threshold is $750. Stealing property valued at $750 or more is a Class D felony.',
        effectiveDate: '2020-10-09',
        confidenceScore: 94,
        sourceUrl: 'https://www.house.mo.gov/',
    },
    MT: {
        citation: 'Mont. Code § 45-6-301',
        textSnippet: 'Montana felony theft threshold is $1,500. Theft of property valued at $1,500 or more is a felony.',
        effectiveDate: '2022-05-08',
        confidenceScore: 72,
        sourceUrl: 'https://www.criminaldefenselawyer.com/resources/theft-and-larceny-laws-montana.htm',
    },
    NE: {
        citation: 'Neb. Rev. Stat. § 28-518',
        textSnippet: 'Nebraska felony theft threshold is $1,500. Theft of property valued at $1,500 or more is a Class IIA felony.',
        effectiveDate: '2019-12-04',
        confidenceScore: 94,
        sourceUrl: 'https://nebraskalegislature.gov/',
    },
    NV: {
        citation: 'Nev. Rev. Stat. § 205.220',
        textSnippet: 'Nevada grand larceny threshold is $1,200. Grand larceny applies when property value is $1,200 or more (updated in 2020).',
        effectiveDate: '2020-11-02',
        confidenceScore: 94,
        sourceUrl: 'https://www.leg.state.nv.us/',
    },
    NH: {
        citation: 'N.H. Rev. Stat. § 637:11',
        textSnippet: 'New Hampshire felony theft threshold is $1,500. Theft is a Class A felony when value exceeds $1,500.',
        effectiveDate: '2024-06-23',
        confidenceScore: 93,
        sourceUrl: 'http://www.gencourt.state.nh.us/',
    },
    NJ: {
        citation: 'N.J. Stat. § 2C:20-2',
        textSnippet: 'New Jersey felony theft threshold is $200—the lowest in the nation. Theft of property valued at $200 or more is a crime of the third degree (felony).',
        effectiveDate: '2024-04-10',
        confidenceScore: 95,
        sourceUrl: 'https://www.njleg.state.nj.us/',
    },
    NM: {
        citation: 'N.M. Stat. § 30-16-1',
        textSnippet: 'New Mexico felony larceny threshold is $500. Larceny of property valued at $500 or more is a fourth-degree felony.',
        effectiveDate: '2022-06-14',
        confidenceScore: 94,
        sourceUrl: 'https://www.nmlegis.gov/',
    },
    NY: {
        citation: 'N.Y. Penal Law § 155.30',
        textSnippet: 'New York grand larceny threshold is $1,000. Grand larceny in the fourth degree (Class E felony) applies when property value exceeds $1,000. Motor vehicle theft is always grand larceny.',
        effectiveDate: '2021-06-04',
        confidenceScore: 95,
        sourceUrl: 'https://www.nysenate.gov/',
    },
    NC: {
        citation: 'N.C. Gen. Stat. § 14-72',
        textSnippet: 'North Carolina felony larceny threshold is $1,000. Felony larceny applies when property value exceeds $1,000.',
        effectiveDate: '2023-02-19',
        confidenceScore: 94,
        sourceUrl: 'https://www.ncleg.gov/',
    },
    ND: {
        citation: 'N.D. Cent. Code § 12.1-23-05',
        textSnippet: 'North Dakota felony theft threshold is $1,000. Theft is a Class C felony when value is $1,000 or more.',
        effectiveDate: '2020-05-18',
        confidenceScore: 93,
        sourceUrl: 'https://www.ndlegis.gov/',
    },
    OH: {
        citation: 'Ohio Rev. Code § 2913.02',
        textSnippet: 'Ohio grand theft threshold is $1,000. Grand theft is a fifth-degree felony when property value is $1,000 or more but less than $7,500.',
        effectiveDate: '2019-08-27',
        confidenceScore: 94,
        sourceUrl: 'https://www.legislature.ohio.gov/',
    },
    OK: {
        citation: 'Okla. Stat. tit. 12, § 95',
        textSnippet: 'Oklahoma grand larceny threshold is $1,000. Grand larceny applies when property value exceeds $1,000.',
        effectiveDate: '2020-05-10',
        confidenceScore: 94,
        sourceUrl: 'https://www.oklegislature.gov/',
    },
    OR: {
        citation: 'Or. Rev. Stat. § 164.055',
        textSnippet: 'Oregon felony theft threshold is $1,000. Theft in the first degree (Class C felony) applies when value exceeds $1,000.',
        effectiveDate: '2019-12-12',
        confidenceScore: 94,
        sourceUrl: 'https://www.oregonlegislature.gov/',
    },
    PA: {
        citation: '18 Pa. Cons. Stat. § 3903',
        textSnippet: 'Pennsylvania felony theft threshold is $2,000 for general theft, $1,000 for retail theft. Theft is a felony of the third degree when value is $2,000 or more.',
        effectiveDate: '2024-04-13',
        confidenceScore: 94,
        sourceUrl: 'https://www.legis.state.pa.us/',
    },
    // RI: Missing for demo error simulation
    SC: {
        citation: 'S.C. Code § 16-13-30',
        textSnippet: 'South Carolina grand larceny threshold is $2,000. Grand larceny applies when property value exceeds $2,000.',
        effectiveDate: '2023-07-27',
        confidenceScore: 94,
        sourceUrl: 'https://www.scstatehouse.gov/',
    },
    SD: {
        citation: 'S.D. Codified Laws § 22-30A-17',
        textSnippet: 'South Dakota grand theft threshold is $1,000. Grand theft applies when property value is $1,000 or more.',
        effectiveDate: '2023-05-05',
        confidenceScore: 93,
        sourceUrl: 'https://sdlegislature.gov/',
    },
    TN: {
        citation: 'Tenn. Code § 39-14-105',
        textSnippet: 'Tennessee felony theft threshold is $1,000. Theft of property valued at $1,000 or more is a Class E felony.',
        effectiveDate: '2020-05-04',
        confidenceScore: 94,
        sourceUrl: 'https://www.capitol.tn.gov/',
    },
    TX: {
        citation: 'Tex. Penal Code § 31.03',
        textSnippet: 'Texas felony theft threshold is $2,500. Theft is a state jail felony when property value is $2,500 or more but less than $30,000.',
        effectiveDate: '2021-10-16',
        confidenceScore: 95,
        sourceUrl: 'https://capitol.texas.gov/',
    },
    UT: {
        citation: 'Utah Code § 76-6-412',
        textSnippet: 'Utah felony theft threshold is $1,500 (updated in 2023). Theft is a third-degree felony when property value is $1,500 or more.',
        effectiveDate: '2018-10-25',
        confidenceScore: 94,
        sourceUrl: 'https://le.utah.gov/',
    },
    VT: {
        citation: 'Vt. Stat. tit. 13, § 2501',
        textSnippet: 'Vermont grand larceny threshold is $900. Grand larceny applies when property value is $900 or more.',
        effectiveDate: '2023-09-10',
        confidenceScore: 94,
        sourceUrl: 'https://legislature.vermont.gov/',
    },
    VA: {
        citation: 'Va. Code § 18.2-95',
        textSnippet: 'Virginia grand larceny threshold is $1,000. Grand larceny applies when property value is $1,000 or more.',
        effectiveDate: '2021-08-04',
        confidenceScore: 94,
        sourceUrl: 'https://virginiageneralassembly.gov/',
    },
    WA: {
        citation: 'Wash. Rev. Code § 9A.56.040',
        textSnippet: 'Washington felony theft threshold is $750. Theft in the second degree (Class C felony) applies when value exceeds $750.',
        effectiveDate: '2024-03-16',
        confidenceScore: 94,
        sourceUrl: 'https://leg.wa.gov/',
    },
    WV: {
        citation: 'W. Va. Code § 61-3-13',
        textSnippet: 'West Virginia grand larceny threshold is $1,000. Grand larceny applies when property value is $1,000 or more.',
        effectiveDate: '2020-04-09',
        confidenceScore: 94,
        sourceUrl: 'https://www.wvlegislature.gov/',
    },
    WI: {
        citation: 'Wis. Stat. § 943.20',
        textSnippet: 'Wisconsin felony theft threshold is $2,500. Theft is a Class I felony when property value exceeds $2,500.',
        effectiveDate: '2019-11-30',
        confidenceScore: 94,
        sourceUrl: 'https://legis.wisconsin.gov/',
    },
    // WY: Missing for demo error simulation
};

// =============================================================================
// Combined Demo Data Export
// =============================================================================

const DEMO_DATA: Record<DemoQuery, Partial<Record<StateCode, DemoStatuteData>>> = {
    adverse_possession: ADVERSE_POSSESSION_DATA,
    fraud_sol: FRAUD_SOL_DATA,
    gta_threshold: GTA_THRESHOLD_DATA,
};

// =============================================================================
// RETRY DEMO DATA (Pre-prepped data for demo retries)
// =============================================================================

const RETRY_DEMO_DATA: Record<DemoQuery, Partial<Record<StateCode, DemoStatuteData>>> = {
    adverse_possession: {
        DE: {
            citation: 'Del. Code tit. 10, § 7901',
            textSnippet: 'Delaware requires 20 years of continuous adverse possession.',
            effectiveDate: '2022-03-10',
            confidenceScore: 94,
            sourceUrl: 'https://legis.delaware.gov/',
        },
        HI: {
            citation: 'Haw. Rev. Stat. § 657-31',
            textSnippet: 'Hawaii requires 20 years of continuous adverse possession.',
            effectiveDate: '2021-11-20',
            confidenceScore: 93,
            sourceUrl: 'https://www.capitol.hawaii.gov/',
        }
    },
    fraud_sol: {
        AK: {
            citation: 'Alaska Stat. § 09.10.070',
            textSnippet: 'Alaska statute of limitations for fraud is 2 years from discovery.',
            effectiveDate: '2023-01-15',
            confidenceScore: 94,
            sourceUrl: 'https://www.akleg.gov/',
        },
        VT: {
            citation: 'Vt. Stat. tit. 12, § 511',
            textSnippet: 'Vermont statute of limitations for fraud is 6 years from discovery.',
            effectiveDate: '2022-05-18',
            confidenceScore: 94,
            sourceUrl: 'https://legislature.vermont.gov/',
        }
    },
    gta_threshold: {
        RI: {
            citation: 'R.I. Gen. Laws § 11-41-1',
            textSnippet: 'Rhode Island felony theft threshold is $1,500. Larceny of property valued at $1,500 or more is a felony.',
            effectiveDate: '2024-02-12',
            confidenceScore: 93,
            sourceUrl: 'http://www.rilegislature.gov/',
        },
        WY: {
            citation: 'Wyo. Stat. § 6-3-402',
            textSnippet: 'Wyoming felony theft threshold is $1,000. Larceny of property valued at $1,000 or more is a felony.',
            effectiveDate: '2023-05-04',
            confidenceScore: 94,
            sourceUrl: 'https://www.wyoleg.gov/',
        }
    }
};

// =============================================================================
// Query Normalization (must be after DEMO_DATA for hoisting)
// =============================================================================

export function normalizeQueryForDemo(query: string): DemoQuery | null {
    const q = query.toLowerCase().trim();

    // Adverse possession matching
    if (q.includes('adverse possession')) return 'adverse_possession';

    // Fraud statute of limitations matching
    if (q.includes('fraud') && (q.includes('statute of limitations') || q.includes('sol') || q.includes('time limit'))) {
        return 'fraud_sol';
    }
    if (q.includes('statute of limitations') && q.includes('fraud')) return 'fraud_sol';

    // Grand theft / felony theft matching (more flexible)
    const hasTheftKeyword = q.includes('theft') || q.includes('larceny') || q.includes('stealing');
    const hasGrandKeyword = q.includes('grand') || q.includes('felony') || q.includes('threshold');
    if (hasTheftKeyword && hasGrandKeyword) return 'gta_threshold';

    return null;
}

// =============================================================================
// Domain Verification Helper
// =============================================================================

/**
 * Check if a URL is from a verified government domain.
 * Verified domains include:
 * - .gov (federal and state government)
 * - .us (official US domains)
 * - Known state legislature domains
 */
function isVerifiedDomain(url: string): boolean {
    try {
        const hostname = new URL(url).hostname.toLowerCase();

        // Check for .gov domains (e.g., leginfo.legislature.ca.gov)
        if (hostname.endsWith('.gov')) return true;

        // Check for .us domains (e.g., leg.state.fl.us)
        if (hostname.endsWith('.us')) return true;

        // Known state legislature domains that don't use .gov/.us
        const knownVerifiedDomains = [
            'ncleg.net',
            'capitol.texas.gov',
            'legis.wisconsin.gov',
            'legislature.vermont.gov',
            'wyoleg.gov',
        ];

        if (knownVerifiedDomains.some(d => hostname.includes(d))) return true;

        return false;
    } catch {
        return false;
    }
}

/**
 * Generate a Google search URL for a legal citation.
 */
function generateGoogleSearchUrl(citation: string, stateCode: StateCode): string {
    const searchQuery = `${citation} ${stateCode} state law`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
}

// =============================================================================
// Demo Statute Lookup
// =============================================================================

export function getDemoStatute(stateCode: StateCode, query: string, isRetry: boolean = false): Statute | null {
    const demoType = normalizeQueryForDemo(query);
    if (!demoType) return null;

    let stateData = DEMO_DATA[demoType]?.[stateCode];

    // If it's a retry and we don't have main data, check retry-specific data
    if (isRetry && !stateData) {
        stateData = RETRY_DEMO_DATA[demoType]?.[stateCode];
    }

    if (!stateData) return null;

    // Determine trust level based on domain verification
    const verified = isVerifiedDomain(stateData.sourceUrl);

    // Generate Google search URL for fallback verification
    const googleSearchUrl = generateGoogleSearchUrl(stateData.citation, stateCode);

    return {
        stateCode,
        citation: stateData.citation,
        textSnippet: stateData.textSnippet,
        effectiveDate: stateData.effectiveDate,
        confidenceScore: stateData.confidenceScore,
        sourceUrl: stateData.sourceUrl,
        googleSearchUrl,
        trustLevel: stateData.trustLevel || (verified ? 'verified' : 'unverified'),
    };
}


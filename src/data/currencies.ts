export interface CurrencyDefinition {
  code: string;
  name: string;
}

export interface CurrencyCountry {
  flag: string;
  name: string;
}

// Offline reference values expressed as USD per one unit of currency. They are
// starting points for onboarding, not live market quotes; users can edit every
// favorite rate after adding it. Unlisted currencies deliberately start at 1.
const defaultUsdPerUnit: Record<string, number> = {
  AED: 0.272294,
  ARS: 0.00072,
  AUD: 0.66,
  BDT: 0.00818,
  BGN: 0.593,
  BHD: 2.6596,
  BRL: 0.19,
  CAD: 0.73,
  CHF: 1.25,
  CLP: 0.00105,
  CNY: 0.139,
  COP: 0.000263,
  CZK: 0.0475,
  DKK: 0.155,
  EGP: 0.0209,
  EUR: 1.16,
  GBP: 1.35,
  HKD: 0.128,
  HUF: 0.00298,
  IDR: 0.00006,
  ILS: 0.316,
  INR: 0.0114,
  ISK: 0.0081,
  JOD: 1.4104,
  JPY: 0.0067,
  KES: 0.00775,
  KRW: 0.00072,
  KWD: 3.26,
  LKR: 0.00323,
  MAD: 0.108,
  MXN: 0.055,
  MYR: 0.237,
  NGN: 0.00068,
  NOK: 0.103,
  NPR: 0.00713,
  NZD: 0.6,
  OMR: 2.6008,
  PEN: 0.295,
  PHP: 0.0171,
  PKR: 0.00359,
  PLN: 0.278,
  QAR: 0.274725,
  RON: 0.228,
  RUB: 0.0123,
  SAR: 0.266667,
  SEK: 0.107,
  SGD: 0.78,
  THB: 0.0307,
  TRY: 0.0246,
  TWD: 0.0318,
  USD: 1,
  UYU: 0.0258,
  VND: 0.000038,
  ZAR: 0.06,
};

const regionalCurrencyCountries: Record<string, CurrencyCountry> = {
  EUR: { flag: '🇪🇺', name: 'European Union' },
  XAD: { flag: '🌍', name: 'Arab Monetary Fund' },
  XAF: { flag: '🌍', name: 'Central Africa' },
  XAG: { flag: '🌍', name: 'Global silver market' },
  XAU: { flag: '🌍', name: 'Global gold market' },
  XBA: { flag: '🌍', name: 'International bond markets' },
  XBB: { flag: '🌍', name: 'International bond markets' },
  XBC: { flag: '🌍', name: 'International bond markets' },
  XBD: { flag: '🌍', name: 'International bond markets' },
  XCD: { flag: '🌎', name: 'Eastern Caribbean' },
  XCG: { flag: '🌎', name: 'Curaçao and Sint Maarten' },
  XDR: { flag: '🌍', name: 'International Monetary Fund' },
  XOF: { flag: '🌍', name: 'West Africa' },
  XPD: { flag: '🌍', name: 'Global palladium market' },
  XPF: { flag: '🌏', name: 'Pacific territories' },
  XPT: { flag: '🌍', name: 'Global platinum market' },
  XSU: { flag: '🌎', name: 'SUCRE member countries' },
  XUA: { flag: '🌍', name: 'African Development Bank' },
};

// Kept in source instead of using Intl.DisplayNames because that API is not
// consistently available in every Expo/Hermes runtime supported by Worthy.
const countryNames: Record<string, string> = {
  AE: 'United Arab Emirates',
  AF: 'Afghanistan',
  AL: 'Albania',
  AM: 'Armenia',
  AO: 'Angola',
  AR: 'Argentina',
  AU: 'Australia',
  AW: 'Aruba',
  AZ: 'Azerbaijan',
  BA: 'Bosnia & Herzegovina',
  BB: 'Barbados',
  BD: 'Bangladesh',
  BH: 'Bahrain',
  BI: 'Burundi',
  BM: 'Bermuda',
  BN: 'Brunei',
  BO: 'Bolivia',
  BR: 'Brazil',
  BS: 'Bahamas',
  BT: 'Bhutan',
  BW: 'Botswana',
  BY: 'Belarus',
  BZ: 'Belize',
  CA: 'Canada',
  CD: 'Democratic Republic of the Congo',
  CH: 'Switzerland',
  CL: 'Chile',
  CN: 'China',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  CV: 'Cape Verde',
  CZ: 'Czechia',
  DJ: 'Djibouti',
  DK: 'Denmark',
  DO: 'Dominican Republic',
  DZ: 'Algeria',
  EG: 'Egypt',
  ER: 'Eritrea',
  ET: 'Ethiopia',
  FJ: 'Fiji',
  FK: 'Falkland Islands',
  GB: 'United Kingdom',
  GE: 'Georgia',
  GH: 'Ghana',
  GI: 'Gibraltar',
  GM: 'Gambia',
  GN: 'Guinea',
  GT: 'Guatemala',
  GY: 'Guyana',
  HK: 'Hong Kong',
  HN: 'Honduras',
  HT: 'Haiti',
  HU: 'Hungary',
  ID: 'Indonesia',
  IL: 'Israel',
  IN: 'India',
  IQ: 'Iraq',
  IR: 'Iran',
  IS: 'Iceland',
  JM: 'Jamaica',
  JO: 'Jordan',
  JP: 'Japan',
  KE: 'Kenya',
  KG: 'Kyrgyzstan',
  KH: 'Cambodia',
  KM: 'Comoros',
  KP: 'North Korea',
  KR: 'South Korea',
  KW: 'Kuwait',
  KY: 'Cayman Islands',
  KZ: 'Kazakhstan',
  LA: 'Laos',
  LB: 'Lebanon',
  LK: 'Sri Lanka',
  LR: 'Liberia',
  LS: 'Lesotho',
  LY: 'Libya',
  MA: 'Morocco',
  MD: 'Moldova',
  MG: 'Madagascar',
  MK: 'North Macedonia',
  MM: 'Myanmar',
  MN: 'Mongolia',
  MO: 'Macao',
  MR: 'Mauritania',
  MU: 'Mauritius',
  MV: 'Maldives',
  MW: 'Malawi',
  MX: 'Mexico',
  MY: 'Malaysia',
  MZ: 'Mozambique',
  NA: 'Namibia',
  NG: 'Nigeria',
  NI: 'Nicaragua',
  NO: 'Norway',
  NP: 'Nepal',
  NZ: 'New Zealand',
  OM: 'Oman',
  PA: 'Panama',
  PE: 'Peru',
  PG: 'Papua New Guinea',
  PH: 'Philippines',
  PK: 'Pakistan',
  PL: 'Poland',
  PY: 'Paraguay',
  QA: 'Qatar',
  RO: 'Romania',
  RS: 'Serbia',
  RU: 'Russia',
  RW: 'Rwanda',
  SA: 'Saudi Arabia',
  SB: 'Solomon Islands',
  SC: 'Seychelles',
  SD: 'Sudan',
  SE: 'Sweden',
  SG: 'Singapore',
  SH: 'Saint Helena',
  SL: 'Sierra Leone',
  SO: 'Somalia',
  SR: 'Suriname',
  SS: 'South Sudan',
  ST: 'São Tomé & Príncipe',
  SV: 'El Salvador',
  SY: 'Syria',
  SZ: 'Eswatini',
  TH: 'Thailand',
  TJ: 'Tajikistan',
  TM: 'Turkmenistan',
  TN: 'Tunisia',
  TO: 'Tonga',
  TR: 'Türkiye',
  TT: 'Trinidad & Tobago',
  TW: 'Taiwan',
  TZ: 'Tanzania',
  UA: 'Ukraine',
  UG: 'Uganda',
  US: 'United States',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VE: 'Venezuela',
  VN: 'Vietnam',
  VU: 'Vanuatu',
  WS: 'Samoa',
  YE: 'Yemen',
  ZA: 'South Africa',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
};

function getFlag(countryCode: string): string {
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split('')
      .map((character) => 127397 + character.charCodeAt(0)),
  );
}

// ISO 4217 List One, published 2026-01-01 by the SIX maintenance agency.
// XTS (testing) and XXX (no currency) are intentionally excluded from user selection.
const currencyData = `
AED|UAE Dirham
AFN|Afghani
ALL|Lek
AMD|Armenian Dram
AOA|Kwanza
ARS|Argentine Peso
AUD|Australian Dollar
AWG|Aruban Florin
AZN|Azerbaijan Manat
BAM|Convertible Mark
BBD|Barbados Dollar
BDT|Taka
BHD|Bahraini Dinar
BIF|Burundi Franc
BMD|Bermudian Dollar
BND|Brunei Dollar
BOB|Boliviano
BOV|Mvdol
BRL|Brazilian Real
BSD|Bahamian Dollar
BTN|Ngultrum
BWP|Pula
BYN|Belarusian Ruble
BZD|Belize Dollar
CAD|Canadian Dollar
CDF|Congolese Franc
CHE|WIR Euro
CHF|Swiss Franc
CHW|WIR Franc
CLF|Unidad de Fomento
CLP|Chilean Peso
CNY|Yuan Renminbi
COP|Colombian Peso
COU|Unidad de Valor Real
CRC|Costa Rican Colon
CUP|Cuban Peso
CVE|Cabo Verde Escudo
CZK|Czech Koruna
DJF|Djibouti Franc
DKK|Danish Krone
DOP|Dominican Peso
DZD|Algerian Dinar
EGP|Egyptian Pound
ERN|Nakfa
ETB|Ethiopian Birr
EUR|Euro
FJD|Fiji Dollar
FKP|Falkland Islands Pound
GBP|Pound Sterling
GEL|Lari
GHS|Ghana Cedi
GIP|Gibraltar Pound
GMD|Dalasi
GNF|Guinean Franc
GTQ|Quetzal
GYD|Guyana Dollar
HKD|Hong Kong Dollar
HNL|Lempira
HTG|Gourde
HUF|Forint
IDR|Rupiah
ILS|New Israeli Sheqel
INR|Indian Rupee
IQD|Iraqi Dinar
IRR|Iranian Rial
ISK|Iceland Krona
JMD|Jamaican Dollar
JOD|Jordanian Dinar
JPY|Yen
KES|Kenyan Shilling
KGS|Som
KHR|Riel
KMF|Comorian Franc
KPW|North Korean Won
KRW|Won
KWD|Kuwaiti Dinar
KYD|Cayman Islands Dollar
KZT|Tenge
LAK|Lao Kip
LBP|Lebanese Pound
LKR|Sri Lanka Rupee
LRD|Liberian Dollar
LSL|Loti
LYD|Libyan Dinar
MAD|Moroccan Dirham
MDL|Moldovan Leu
MGA|Malagasy Ariary
MKD|Denar
MMK|Kyat
MNT|Tugrik
MOP|Pataca
MRU|Ouguiya
MUR|Mauritius Rupee
MVR|Rufiyaa
MWK|Malawi Kwacha
MXN|Mexican Peso
MXV|Mexican Unidad de Inversion (UDI)
MYR|Malaysian Ringgit
MZN|Mozambique Metical
NAD|Namibia Dollar
NGN|Naira
NIO|Cordoba Oro
NOK|Norwegian Krone
NPR|Nepalese Rupee
NZD|New Zealand Dollar
OMR|Rial Omani
PAB|Balboa
PEN|Sol
PGK|Kina
PHP|Philippine Peso
PKR|Pakistan Rupee
PLN|Zloty
PYG|Guarani
QAR|Qatari Rial
RON|Romanian Leu
RSD|Serbian Dinar
RUB|Russian Ruble
RWF|Rwanda Franc
SAR|Saudi Riyal
SBD|Solomon Islands Dollar
SCR|Seychelles Rupee
SDG|Sudanese Pound
SEK|Swedish Krona
SGD|Singapore Dollar
SHP|Saint Helena Pound
SLE|Leone
SOS|Somali Shilling
SRD|Surinam Dollar
SSP|South Sudanese Pound
STN|Dobra
SVC|El Salvador Colon
SYP|Syrian Pound
SZL|Lilangeni
THB|Baht
TJS|Somoni
TMT|Turkmenistan New Manat
TND|Tunisian Dinar
TOP|Pa’anga
TRY|Turkish Lira
TTD|Trinidad and Tobago Dollar
TWD|New Taiwan Dollar
TZS|Tanzanian Shilling
UAH|Hryvnia
UGX|Uganda Shilling
USD|US Dollar
USN|US Dollar (Next day)
UYI|Uruguay Peso en Unidades Indexadas (UI)
UYU|Peso Uruguayo
UYW|Unidad Previsional
UZS|Uzbekistan Sum
VED|Bolívar Soberano
VES|Bolívar Soberano
VND|Dong
VUV|Vatu
WST|Tala
XAD|Arab Accounting Dinar
XAF|CFA Franc BEAC
XAG|Silver
XAU|Gold
XBA|Bond Markets Unit European Composite Unit (EURCO)
XBB|Bond Markets Unit European Monetary Unit (E.M.U.-6)
XBC|Bond Markets Unit European Unit of Account 9 (E.U.A.-9)
XBD|Bond Markets Unit European Unit of Account 17 (E.U.A.-17)
XCD|East Caribbean Dollar
XCG|Caribbean Guilder
XDR|SDR (Special Drawing Right)
XOF|CFA Franc BCEAO
XPD|Palladium
XPF|CFP Franc
XPT|Platinum
XSU|Sucre
XUA|ADB Unit of Account
YER|Yemeni Rial
ZAR|Rand
ZMW|Zambian Kwacha
ZWG|Zimbabwe Gold
`;

export const CURRENCY_CATALOG: CurrencyDefinition[] = currencyData
  .trim()
  .split('\n')
  .map((row) => {
    const [code, name] = row.split('|');
    return { code, name };
  });

export function getCurrencyDefinition(code: string): CurrencyDefinition | undefined {
  const normalized = code.trim().toUpperCase();
  return CURRENCY_CATALOG.find((currency) => currency.code === normalized);
}

export function getCurrencyCountry(code: string): CurrencyCountry {
  const normalized = code.trim().toUpperCase();
  const regionalCountry = regionalCurrencyCountries[normalized];
  if (regionalCountry) return regionalCountry;

  const countryCode = normalized.slice(0, 2);
  const countryName = countryNames[countryCode];
  if (!countryName) {
    return { flag: '🌐', name: 'International' };
  }

  return { flag: getFlag(countryCode), name: countryName };
}

export function getDefaultRateToBase(currencyCode: string, baseCurrencyCode: string): number {
  const normalizedCurrency = currencyCode.trim().toUpperCase();
  const normalizedBase = baseCurrencyCode.trim().toUpperCase();
  if (normalizedCurrency === normalizedBase) return 1;

  const currencyUsdValue = defaultUsdPerUnit[normalizedCurrency];
  const baseUsdValue = defaultUsdPerUnit[normalizedBase];
  if (!currencyUsdValue || !baseUsdValue) return 1;

  return Number((currencyUsdValue / baseUsdValue).toPrecision(8));
}

export function getCurrencySymbol(code: string): string {
  try {
    const currencyPart = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency');
    return currencyPart?.value ?? code;
  } catch {
    return code;
  }
}

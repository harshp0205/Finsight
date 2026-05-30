// Maps user-friendly names/tickers → Yahoo Finance format
// Indian stocks need .NS suffix; US stocks stay as-is
const TICKER_MAP = {
  // Indian - by common name
  'infosys':           'INFY.NS',
  'infy':              'INFY.NS',
  'tcs':               'TCS.NS',
  'tata consultancy':  'TCS.NS',
  'wipro':             'WIPRO.NS',
  'hcl':               'HCLTECH.NS',
  'hcltech':           'HCLTECH.NS',
  'hcl technologies':  'HCLTECH.NS',
  'reliance':          'RELIANCE.NS',
  'ril':               'RELIANCE.NS',
  'hdfc':              'HDFCBANK.NS',
  'hdfcbank':          'HDFCBANK.NS',
  'hdfc bank':         'HDFCBANK.NS',
  'icici':             'ICICIBANK.NS',
  'icicibank':         'ICICIBANK.NS',
  'icici bank':        'ICICIBANK.NS',
  'sbi':               'SBIN.NS',
  'sbin':              'SBIN.NS',
  'state bank':        'SBIN.NS',
  'bajaj':             'BAJFINANCE.NS',
  'bajajfinance':      'BAJFINANCE.NS',
  'bajaj finance':     'BAJFINANCE.NS',
  'airtel':            'BHARTIARTL.NS',
  'bhartiartl':        'BHARTIARTL.NS',
  'bharti airtel':     'BHARTIARTL.NS',
  'asian paints':      'ASIANPAINT.NS',
  'asianpaint':        'ASIANPAINT.NS',
  'maruti':            'MARUTI.NS',
  'msil':              'MARUTI.NS',
  'kotak':             'KOTAKBANK.NS',
  'kotakbank':         'KOTAKBANK.NS',
  'kotak bank':        'KOTAKBANK.NS',
  'lt':                'LT.NS',
  'l&t':               'LT.NS',
  'larsen':            'LT.NS',
  'itc':               'ITC.NS',
  'sun pharma':        'SUNPHARMA.NS',
  'sunpharma':         'SUNPHARMA.NS',
  'axis bank':         'AXISBANK.NS',
  'axisbank':          'AXISBANK.NS',
  'nifty':             '^NSEI',
  'sensex':            '^BSESN',
  'ongc':              'ONGC.NS',
  'ntpc':              'NTPC.NS',
  'powergrid':         'POWERGRID.NS',
  'tatamotors':        'TATAMOTORS.NS',
  'tata motors':       'TATAMOTORS.NS',
  'tatasteel':         'TATASTEEL.NS',
  'tata steel':        'TATASTEEL.NS',
  'adani':             'ADANIENT.NS',
  'adani enterprises': 'ADANIENT.NS',
  'adani ports':       'ADANIPORTS.NS',
  'adaniports':        'ADANIPORTS.NS',
  'zomato':            'ZOMATO.NS',
  'paytm':             'PAYTM.NS',
  'nykaa':             'NYKAA.NS',
  'dmart':             'DMART.NS',
  'avenue supermarts': 'DMART.NS',
  'hindustan unilever':'HINDUNILVR.NS',
  'hul':               'HINDUNILVR.NS',
  'nestle':            'NESTLEIND.NS',
  'dr reddy':          'DRREDDY.NS',
  'cipla':             'CIPLA.NS',
  'divis':             'DIVISLAB.NS',
};

// Known Indian NSE tickers that users might type without .NS
const NSE_TICKERS = new Set([
  'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','HINDUNILVR','ITC','SBIN',
  'BHARTIARTL','BAJFINANCE','KOTAKBANK','LT','HCLTECH','ASIANPAINT','AXISBANK',
  'MARUTI','SUNPHARMA','WIPRO','ULTRACEMCO','TITAN','NESTLEIND','POWERGRID',
  'NTPC','ONGC','TATAMOTORS','TATASTEEL','ADANIENT','ADANIPORTS','DMART',
  'ZOMATO','PAYTM','NYKAA','DIVISLAB','DRREDDY','CIPLA','BAJAJFINSV',
  'TECHM','GRASIM','INDUSINDBK','HINDALCO','JSWSTEEL','COALINDIA','EICHERMOT',
]);

export function resolveTicker(input) {
  if (!input) return input;
  const clean = input.trim();

  // Already has exchange suffix (.NS, .BO, etc.) — use as-is
  if (clean.includes('.')) return clean.toUpperCase();

  // Check name/alias map (case-insensitive)
  const mapped = TICKER_MAP[clean.toLowerCase()];
  if (mapped) return mapped;

  // Known NSE ticker typed without suffix
  const upper = clean.toUpperCase();
  if (NSE_TICKERS.has(upper)) return `${upper}.NS`;

  // Assume US ticker
  return upper;
}

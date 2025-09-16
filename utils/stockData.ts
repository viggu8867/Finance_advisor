// A curated list of popular stocks with fixed prices for the dropdown feature.
// In a real-world application, this would likely come from an API.

export interface StockInfo {
  name: string;
  ticker: string;
  price: number; // Price in INR (₹)
}

export const stockList: StockInfo[] = [
  // Indian Stocks
  { name: 'Reliance Industries', ticker: 'RELIANCE.NS', price: 2950.50 },
  { name: 'Tata Consultancy Services', ticker: 'TCS.NS', price: 3850.75 },
  { name: 'HDFC Bank', ticker: 'HDFCBANK.NS', price: 1520.00 },
  { name: 'Infosys', ticker: 'INFY.NS', price: 1515.25 },
  { name: 'ICICI Bank', ticker: 'ICICIBANK.NS', price: 1125.80 },
  { name: 'Hindustan Unilever', ticker: 'HINDUNILVR.NS', price: 2360.45 },
  { name: 'State Bank of India', ticker: 'SBIN.NS', price: 830.60 },
  { name: 'Bharti Airtel', ticker: 'BHARTIARTL.NS', price: 1405.00 },
  { name: 'ITC Limited', ticker: 'ITC.NS', price: 425.30 },
  { name: 'Larsen & Toubro', ticker: 'LT.NS', price: 3590.10 },
  { name: 'Bajaj Finance', ticker: 'BAJFINANCE.NS', price: 6980.55 },
  { name: 'Wipro', ticker: 'WIPRO.NS', price: 460.90 },
  { name: 'Adani Enterprises', ticker: 'ADANIENT.NS', price: 3210.00 },
  { name: 'Maruti Suzuki India', ticker: 'MARUTI.NS', price: 12750.00 },
  { name: 'Tata Motors', ticker: 'TATAMOTORS.NS', price: 955.50 },
  { name: 'Asian Paints', ticker: 'ASIANPAINT.NS', price: 2890.80 },
  { name: 'Sun Pharmaceutical', ticker: 'SUNPHARMA.NS', price: 1500.15 },
  { name: 'Mahindra & Mahindra', ticker: 'M&M.NS', price: 2850.20 },
  { name: 'Titan Company', ticker: 'TITAN.NS', price: 3410.00 },
  { name: 'Zomato', ticker: 'ZOMATO.NS', price: 190.75 },

  // US Stocks (with example INR prices)
  { name: 'Apple Inc.', ticker: 'AAPL', price: 16250.00 },
  { name: 'Microsoft Corporation', ticker: 'MSFT', price: 37000.50 },
  { name: 'Amazon.com, Inc.', ticker: 'AMZN', price: 15400.75 },
  { name: 'NVIDIA Corporation', ticker: 'NVDA', price: 101000.00 },
  { name: 'Alphabet Inc. (Google)', ticker: 'GOOGL', price: 14800.20 },
  { name: 'Meta Platforms, Inc.', ticker: 'META', price: 41500.00 },
  { name: 'Tesla, Inc.', ticker: 'TSLA', price: 14900.80 },
  { name: 'Berkshire Hathaway Inc.', ticker: 'BRK.B', price: 35500.00 },
  { name: 'Eli Lilly and Company', ticker: 'LLY', price: 71000.00 },
  { name: 'Broadcom Inc.', ticker: 'AVGO', price: 142000.00 },
  { name: 'JPMorgan Chase & Co.', ticker: 'JPM', price: 16500.40 },
  { name: 'Visa Inc.', ticker: 'V', price: 23000.00 },
  { name: 'Exxon Mobil Corporation', ticker: 'XOM', price: 9500.00 },
  { name: 'UnitedHealth Group', ticker: 'UNH', price: 41000.70 },
  { name: 'Mastercard Incorporated', ticker: 'MA', price: 39500.00 },
  { name: 'Johnson & Johnson', ticker: 'JNJ', price: 12400.25 },
  { name: 'Procter & Gamble Co.', ticker: 'PG', price: 14000.00 },
  { name: 'Costco Wholesale Corp.', ticker: 'COST', price: 69000.50 },
  { name: 'Home Depot, Inc.', ticker: 'HD', price: 29500.00 },
  { name: 'Merck & Co., Inc.', ticker: 'MRK', price: 10800.80 },
  { name: 'AbbVie Inc.', ticker: 'ABBV', price: 14100.00 },
  { name: 'Chevron Corporation', ticker: 'CVX', price: 13200.00 },
  { name: 'Oracle Corporation', ticker: 'ORCL', price: 11900.90 },
  { name: 'Adobe Inc.', ticker: 'ADBE', price: 46000.00 },
  { name: 'Coca-Cola Company', ticker: 'KO', price: 5200.00 },
  { name: 'Bank of America Corp', ticker: 'BAC', price: 3300.00 },
  { name: 'Salesforce, Inc.', ticker: 'CRM', price: 20000.00 },
  { name: 'Netflix, Inc.', ticker: 'NFLX', price: 56000.30 },
  { name: 'PepsiCo, Inc.', ticker: 'PEP', price: 14500.00 },
  { name: 'Walmart Inc.', ticker: 'WMT', price: 5500.60 },
];

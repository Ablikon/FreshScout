/**
 * Wolt Store Adapter
 * 
 * Handles Wolt platform (Wolt Market + Airba Fresh)
 * 
 * Wolt API Base: https://consumer-api.wolt.com
 * 
 * Key endpoints:
 * - GET /order-xp/web/v1/venue/slug/{slug}/dynamic/ — venue info + delivery
 * - Address autocomplete via Google Places proxy
 * 
 * Order placement: via Puppeteer browser automation
 * Token refresh: POST https://authentication.wolt.com/v1/wauth2/access_token
 * 
 * CREDENTIALS:
 * - Cookies from wolt_cookies.json (saved after manual login)
 * - WOLT_ACCESS_TOKEN: Bearer token for venue data API
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { placeWoltOrderViaBrowser } from './wolt.puppeteer.js';

const API_URL = 'https://consumer-api.wolt.com';

// Token path: use local path for development, Docker path for production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = process.env.NODE_ENV === 'production' 
  ? '/app/data/wolt_tokens.json'
  : path.join(__dirname, '../../data/wolt_tokens.json');

// Wolt venue slugs for Almaty
const VENUE_SLUGS = {
  wolt: 'wolt-market-shevchenko', // Working Wolt Market in Almaty
  airba: 'airba-fresh',
};

/**
 * Load tokens from file or env
 */
async function getTokens() {
  console.log('[Wolt] TOKEN_PATH:', TOKEN_PATH);
  // Check file first (may have refreshed tokens)
  try {
    const data = await fs.readFile(TOKEN_PATH, 'utf-8');
    console.log('[Wolt] File read success, length:', data.length);
    const tokens = JSON.parse(data);
    if (tokens.accessToken) {
      console.log('[Wolt] Loaded tokens from file, expires:', new Date(tokens.expiresAt).toISOString());
      return tokens;
    }
  } catch (err) {
    console.error('[Wolt] Failed to read token file:', err.message);
  }
  
  // Fall back to env
  if (process.env.WOLT_ACCESS_TOKEN) {
    console.log('[Wolt] Using tokens from env');
    const tokens = {
      accessToken: process.env.WOLT_ACCESS_TOKEN,
      refreshToken: process.env.WOLT_REFRESH_TOKEN || '',
      expiresAt: Date.now() + 25 * 60 * 1000, // assume ~25 min left (token was just created)
    };
    // Save to file immediately so refresh works
    await saveTokens(tokens);
    return tokens;
  }
  
  return null;
}

/**
 * Save tokens
 */
async function saveTokens(tokens) {
  try {
    await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('[Wolt] Tokens saved to', TOKEN_PATH);
  } catch (err) {
    console.error('[Wolt] Failed to save tokens:', err.message);
  }
}

/**
 * Set Wolt tokens manually (for initial setup)
 */
export async function setWoltTokens({ accessToken, refreshToken }) {
  const tokens = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 25 * 60 * 1000, // assume 25 min left
  };
  await saveTokens(tokens);
  console.log('[Wolt] Tokens set manually');
  return tokens;
}

/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken) {
  console.log('[Wolt] Refreshing access token...');
  
  // Wolt uses OAuth2-style token refresh at authentication.wolt.com
  const response = await fetch('https://authentication.wolt.com/v1/wauth2/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Wolt/4.0 (iPhone; iOS 16.0)',
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Wolt] Refresh error:', response.status, errorText);
    throw new Error('Failed to refresh Wolt token: ' + response.status);
  }
  
  const data = await response.json();
  console.log('[Wolt] Token refreshed successfully!');
  
  const tokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in || 1800) * 1000,
  };
  
  await saveTokens(tokens);
  return tokens;
}

/**
 * Get valid access token, refresh if needed
 */
async function getAccessToken() {
  let tokens = await getTokens();
  
  if (!tokens) {
    throw new Error(
      'Wolt не авторизован. Добавь WOLT_ACCESS_TOKEN и WOLT_REFRESH_TOKEN в docker-compose.yml'
    );
  }
  
  // Check if expired (with 5 min buffer)
  if (tokens.expiresAt && tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
    if (tokens.refreshToken) {
      tokens = await refreshAccessToken(tokens.refreshToken);
    } else {
      throw new Error('Wolt token expired and no refresh token available');
    }
  }
  
  return tokens.accessToken;
}

/**
 * Make authenticated API request with auto-retry on 401
 */
async function apiRequest(endpoint, options = {}, retried = false) {
  console.log('[Wolt API] Starting request to:', endpoint);
  const token = await getAccessToken();
  console.log('[Wolt API] Token obtained, first 50 chars:', token?.substring(0, 50) + '...');
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Wolt/4.0 (iPhone; iOS 16.0)',
    'Authorization': `Bearer ${token}`,
    'x-wolt-platform': 'ios',
    ...options.headers,
  };
  
  console.log('[Wolt API] Fetching:', `${API_URL}${endpoint}`);
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  console.log('[Wolt API] Response status:', response.status);
  
  // If 401 and haven't retried yet, refresh token and retry
  if (response.status === 401 && !retried) {
    console.log('[Wolt] Got 401, refreshing token and retrying...');
    const tokens = await getTokens();
    if (tokens?.refreshToken) {
      await refreshAccessToken(tokens.refreshToken);
      return apiRequest(endpoint, options, true);
    }
  }
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wolt API error ${response.status}: ${text}`);
  }
  
  // Some endpoints return empty response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return { success: true };
}

/**
 * Address autocomplete using Google Places (via Wolt proxy)
 */
export async function addressAutocomplete(input, city = 'almaty') {
  if (!input || input.length < 3) {
    return { predictions: [] };
  }
  
  console.log('[Wolt] Address autocomplete:', input);
  
  // Just use input directly - let Google figure out the location
  const encoded = encodeURIComponent(input);
  
  // Bias results towards Almaty area
  const almatyLat = 43.238949;
  const almatyLon = 76.945465;
  
  try {
    const response = await fetch(
      `https://consumer-api.wolt.com/v1/google/places/autocomplete/json?input=${encoded}&location=${almatyLat},${almatyLon}&radius=50000&components=country:kz`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Wolt/4.0 (iPhone; iOS 16.0)',
        },
      }
    );
    
    if (!response.ok) {
      console.log('[Wolt] Autocomplete response not ok:', response.status);
      return { predictions: [] };
    }
    
    const data = await response.json();
    console.log('[Wolt] Autocomplete raw results:', data.predictions?.length || 0);
    
    // Format predictions (already filtered by country:kz)
    const predictions = (data.predictions || [])
      .slice(0, 5)
      .map(p => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description?.split(',')[0] || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
      }));
    
    console.log('[Wolt] Returning predictions:', predictions.length);
    return { predictions };
    
  } catch (err) {
    console.error('[Wolt] Autocomplete error:', err.message);
    return { predictions: [] };
  }
}

/**
 * Get coordinates from place_id
 */
export async function getPlaceCoordinates(placeId) {
  console.log('[Wolt] Getting coordinates for place:', placeId);
  
  try {
    const response = await fetch(
      `https://consumer-api.wolt.com/v1/google/geocode/json?place_id=${placeId}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Wolt/4.0 (iPhone; iOS 16.0)',
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results[0]?.geometry?.location) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lon: loc.lng };
    }
    
    return null;
    
  } catch (err) {
    console.error('[Wolt] Place coordinates error:', err.message);
    return null;
  }
}

/**
 * Geocode address to get coordinates
 */
async function geocodeAddress(address, city = 'almaty') {
  console.log('[Wolt] Geocoding address:', address);
  
  // Default Almaty coordinates
  const defaultCoords = { lat: 43.238949, lon: 76.945465 };
  
  // Build query with Kazakhstan explicitly
  const cityName = city === 'almaty' ? 'Алматы' : city;
  const query = `${address}, ${cityName}, Kazakhstan`;
  const encoded = encodeURIComponent(query);
  
  try {
    const response = await fetch(
      `https://consumer-api.wolt.com/v1/google/places/autocomplete/json?input=${encoded}&components=country:kz`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Wolt/4.0 (iPhone; iOS 16.0)',
        },
      }
    );
    
    if (!response.ok) {
      console.log('[Wolt] Geocoding failed, using fallback');
      return defaultCoords;
    }
    
    const data = await response.json();
    console.log('[Wolt] Autocomplete predictions:', data.predictions?.length || 0);
    
    if (data.predictions && data.predictions.length > 0) {
      // Find prediction that contains Kazakhstan or Алматы
      const kzPrediction = data.predictions.find(p => 
        p.description?.includes('Kazakhstan') || 
        p.description?.includes('Казахстан') ||
        p.description?.includes('Алматы') ||
        p.description?.includes('Almaty')
      ) || data.predictions[0];
      
      const placeId = kzPrediction.place_id;
      console.log('[Wolt] Using place:', kzPrediction.description);
      
      // Get place details for coordinates
      const detailsResponse = await fetch(
        `https://consumer-api.wolt.com/v1/google/geocode/json?place_id=${placeId}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Wolt/4.0 (iPhone; iOS 16.0)',
          },
        }
      );
      
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        if (details.results && details.results[0]?.geometry?.location) {
          const loc = details.results[0].geometry.location;
          console.log('[Wolt] Geocoded to:', loc.lat, loc.lng);
          return { lat: loc.lat, lon: loc.lng };
        }
      }
    }
    
    console.log('[Wolt] Geocoding: no results, using fallback');
    return defaultCoords;
    
  } catch (err) {
    console.error('[Wolt] Geocoding error:', err.message);
    return defaultCoords;
  }
}

/**
 * Check venue delivery info (availability + fee) using authenticated API
 */
export async function getVenueDeliveryInfo(venueSlug, coordinates) {
  console.log(`[Wolt] Checking delivery for ${venueSlug} at`, coordinates);
  
  // Check if coordinates are within Almaty area
  const isInAlmaty = 
    coordinates.lat >= 43.1 && coordinates.lat <= 43.45 &&
    coordinates.lon >= 76.7 && coordinates.lon <= 77.2;
  
  if (!isInAlmaty) {
    return {
      available: false,
      error: 'Адрес вне зоны доставки Алматы',
      isInDeliveryArea: false,
    };
  }
  
  try {
    // Use authenticated API to get real delivery info (note: trailing slash required!)
    const venueData = await apiRequest(
      `/order-xp/web/v1/venue/slug/${venueSlug}/dynamic/?lat=${coordinates.lat}&lon=${coordinates.lon}`
    );
    
    console.log('[Wolt] Venue status:', JSON.stringify({
      online: venueData.venue?.online,
      open_status: venueData.venue?.open_status?.is_open,
      delivery_open_status: venueData.venue?.delivery_open_status?.is_open,
      delivery_configs: venueData.venue?.delivery_configs?.map(c => ({
        label: c.label,
        method: c.method,
        schedule: c.schedule,
        estimate: c.estimate?.label,
        price: c.price,
      })),
    }, null, 2));
    
    // Extract delivery info from response
    const venue = venueData.venue || venueData;
    const deliveryConfigs = venue.delivery_configs || [];
    
    // Find standard delivery config (homedelivery with standard schedule)
    const standardDelivery = deliveryConfigs.find(c => 
      c.method === 'homedelivery' && c.schedule === 'standard'
    );
    
    // Find scheduled delivery config
    const scheduledDelivery = deliveryConfigs.find(c => 
      c.method === 'homedelivery' && c.schedule === 'time_slot'
    );
    
    // Get delivery time estimate from standard delivery
    let deliveryTime = null;
    if (standardDelivery?.estimate) {
      deliveryTime = `${standardDelivery.estimate.min}-${standardDelivery.estimate.max} мин`;
    }
    
    // Get delivery fee from price field
    let deliveryFee = 0;
    if (standardDelivery?.price?.amount) {
      deliveryFee = Math.round(standardDelivery.price.amount / 100);
    }
    
    // Parse header metadata for min order and delivery fee
    let minOrderAmount = 0;
    const deliveryStatus = venue.header?.delivery_method_statuses?.find(s => s.delivery_method === 'DELIVERY');
    if (deliveryStatus?.metadata) {
      for (const meta of deliveryStatus.metadata) {
        // Parse "Min. order KZT4,200.00"
        if (meta.value?.includes('Min. order')) {
          const match = meta.value.match(/KZT([\d,\.]+)/);
          if (match) {
            minOrderAmount = Math.round(parseFloat(match[1].replace(/,/g, '')));
          }
        }
        // Parse delivery fee "KZT0.00" or "KZT439.00"
        if (meta.link === 'DELIVERY_FEE' && meta.value) {
          const match = meta.value.match(/KZT([\d,\.]+)/);
          if (match) {
            deliveryFee = Math.round(parseFloat(match[1].replace(/,/g, '')));
          }
        }
      }
    }
    
    // Check status
    const isDeliveryOpen = venue.delivery_open_status?.is_open === true;
    const isOnline = venue.online === true;
    const hasStandardDelivery = !!standardDelivery;
    const hasScheduledDelivery = !!scheduledDelivery;
    
    // Determine next available time slot for scheduled delivery
    let nextAvailableSlot = null;
    let scheduledSlots = [];
    if (scheduledDelivery?.tso_schedule) {
      for (const day of scheduledDelivery.tso_schedule) {
        if (day.time_slots && day.time_slots.length > 0) {
          if (!nextAvailableSlot) {
            nextAvailableSlot = `${day.day}: ${day.time_slots[0].time_slot_formatted}`;
          }
          scheduledSlots.push({
            day: day.day,
            slots: day.time_slots.slice(0, 3).map(s => s.time_slot_formatted),
          });
          if (scheduledSlots.length >= 2) break;
        }
      }
    }
    
    // Determine availability - either standard or scheduled delivery must be available
    const available = isDeliveryOpen && (isOnline || hasScheduledDelivery);
    
    // Status message
    let statusMessage = null;
    if (!isDeliveryOpen) {
      statusMessage = 'Доставка закрыта';
    } else if (!isOnline && hasScheduledDelivery) {
      statusMessage = 'Доступна запланированная доставка';
    } else if (!isOnline) {
      statusMessage = 'Магазин временно не принимает заказы';
    }
    
    return {
      available,
      deliveryFee,
      deliveryTime,
      minOrderAmount,
      isInDeliveryArea: true,
      venueName: venueSlug.includes('airba') ? 'Airba Fresh' : 'Wolt Market',
      isOpen: isDeliveryOpen,
      isOnline,
      hasStandardDelivery,
      hasScheduledDelivery,
      nextAvailableSlot,
      scheduledSlots,
      statusMessage,
    };
    
  } catch (err) {
    console.error(`[Wolt] Failed to get real delivery info for ${venueSlug}:`, err.message);
    
    // Fallback to estimated values if API fails
    const storeFees = {
      'wolt-market-shevchenko': { fee: 0, minOrder: 4200, time: '25-35 мин' },
      'airba-fresh': { fee: 0, minOrder: 3000, time: '30-50 мин' },
    };
    
    const storeInfo = storeFees[venueSlug] || { fee: 500, minOrder: 2000, time: '30-60 мин' };
    
    return {
      available: true,
      deliveryFee: storeInfo.fee,
      deliveryTime: storeInfo.time,
      minOrderAmount: storeInfo.minOrder,
      isInDeliveryArea: true,
      venueName: venueSlug.includes('airba') ? 'Airba Fresh' : 'Wolt Market',
      estimated: true, // Flag that these are estimated values
    };
  }
}

/**
 * Check delivery availability and fees for multiple stores
 */
export async function checkDelivery({ address, city = 'almaty', stores = ['wolt', 'airba'], coordinates = null }) {
  console.log('[Wolt] Checking delivery for address:', address);
  
  // Use provided coordinates or geocode address
  if (!coordinates) {
    coordinates = await geocodeAddress(address, city);
  }
  
  const results = {};
  
  for (const store of stores) {
    const venueSlug = VENUE_SLUGS[store] || store;
    results[store] = await getVenueDeliveryInfo(venueSlug, coordinates);
  }
  
  return {
    coordinates,
    stores: results,
  };
}

/**
 * Generate a Wolt deep link to venue with optional search query
 */
export function generateWoltDeepLink(venueSlug, searchQuery = null) {
  const baseUrl = `https://wolt.com/ru/kaz/almaty/venue/${venueSlug}`;
  if (searchQuery) {
    return `${baseUrl}?q=${encodeURIComponent(searchQuery)}`;
  }
  return baseUrl;
}

/**
 * Main function to place a Wolt order via Puppeteer automation
 * 
 * Requires: cookies saved from manual login (run wolt-login.js first)
 */
export async function placeWoltOrder({ items, address, apartment, entrance, floor, comment, contactPhone, city = 'almaty', venueSlug }) {
  console.log('[Wolt] Starting REAL order for', items.length, 'items');
  
  // Determine venue slug from items or use default
  const slug = venueSlug || items[0]?.venueSlug || items[0]?.url?.match(/venue\/([^\/]+)/)?.[1] || 'wolt-market-shevchenko';
  const isAirba = slug.includes('airba');
  
  // Build full address
  let fullAddress = address;
  if (apartment) fullAddress += `, кв. ${apartment}`;
  if (entrance) fullAddress += `, подъезд ${entrance}`;
  if (floor) fullAddress += `, этаж ${floor}`;
  
  try {
    // Use Puppeteer for real browser-based ordering
    const result = await placeWoltOrderViaBrowser({
      venueSlug: slug,
      items: items.map(item => ({
        name: item.name || item.title,
        productId: item.productId,
        quantity: item.quantity || 1,
        price: item.price || item.cost,
      })),
      deliveryAddress: fullAddress,
      apartment,
      comment,
      phone: contactPhone,
    });
    
    if (result.success) {
      console.log('[Wolt] ✅ Order placed successfully:', result.orderId);
    } else {
      console.log('[Wolt] ❌ Order failed:', result.error);
    }
    
    return result;
    
  } catch (err) {
    console.error('[Wolt] Order error:', err.message);
    
    // Fallback to deep links if Puppeteer fails
    console.log('[Wolt] Falling back to manual checkout...');
    const venueUrl = generateWoltDeepLink(slug);
    
    return {
      success: false,
      error: err.message,
      fallback: true,
      venueUrl,
      message: 'Автоматический заказ не удался. Пожалуйста, оформите заказ вручную.',
    };
  }
}


#!/usr/bin/env node
/**
 * Refresh Wolt access token using the refresh token
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = process.env.NODE_ENV === 'production'
  ? '/app/data/wolt_tokens.json'
  : path.join(__dirname, '../data/wolt_tokens.json');

async function refreshToken() {
  console.log('🔄 Wolt Token Refresh');
  console.log('======================\n');
  
  // Load current tokens
  let tokens;
  try {
    const data = await fs.readFile(TOKENS_PATH, 'utf-8');
    tokens = JSON.parse(data);
    console.log('📁 Loaded tokens from:', TOKENS_PATH);
  } catch (err) {
    console.error('❌ Failed to load tokens:', err.message);
    process.exit(1);
  }
  
  if (!tokens.refreshToken) {
    console.error('❌ No refresh token available');
    process.exit(1);
  }
  
  console.log('⏳ Current token expires:', new Date(tokens.expiresAt).toLocaleString());
  console.log('   Expired:', Date.now() > tokens.expiresAt ? 'YES' : 'NO');
  
  // Refresh the token
  console.log('\n🔄 Refreshing access token...');
  
  try {
    const response = await fetch('https://authentication.wolt.com/v1/wauth2/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Wolt/4.0 (iPhone; iOS 16.0)',
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(tokens.refreshToken)}`,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Refresh failed:', response.status, errorText);
      process.exit(1);
    }
    
    const data = await response.json();
    console.log('✅ Token refreshed!');
    
    const newTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      expiresAt: Date.now() + (data.expires_in || 1800) * 1000,
    };
    
    // Save new tokens
    await fs.writeFile(TOKENS_PATH, JSON.stringify(newTokens, null, 2));
    console.log('💾 Saved new tokens');
    console.log('⏳ New token expires:', new Date(newTokens.expiresAt).toLocaleString());
    
    // Also update cookies file - but MERGE with existing cookies, don't replace!
    const COOKIES_PATH = process.env.NODE_ENV === 'production'
      ? '/app/data/wolt_cookies.json'
      : path.join(__dirname, '../data/wolt_cookies.json');
    
    // Try to load existing cookies
    let existingCookies = [];
    try {
      const existingData = await fs.readFile(COOKIES_PATH, 'utf-8');
      existingCookies = JSON.parse(existingData);
    } catch {}
    
    // Update only the auth cookies
    const authCookieNames = ['__wtoken', '__wrtoken'];
    const filteredCookies = existingCookies.filter(c => !authCookieNames.includes(c.name));
    
    const newAuthCookies = [
      {
        name: '__wtoken',
        value: encodeURIComponent(JSON.stringify({
          accessToken: newTokens.accessToken,
          expirationTime: newTokens.expiresAt,
        })),
        domain: '.wolt.com',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      },
      {
        name: '__wrtoken',
        value: encodeURIComponent('"' + newTokens.refreshToken + '"'),
        domain: '.wolt.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ];
    
    const mergedCookies = [...filteredCookies, ...newAuthCookies];
    await fs.writeFile(COOKIES_PATH, JSON.stringify(mergedCookies, null, 2));
    console.log('🍪 Updated auth cookies (merged with existing)');
    
    console.log('\n✅ Done! Token is now valid.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

refreshToken();

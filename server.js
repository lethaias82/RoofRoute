const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Google API Key - try environment variable first, then fallback
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyD4DOCU4kvOM5gzBzv12gU-wp91o65dbGI';

console.log('🔑 API Key Status:', GOOGLE_API_KEY ? '✅ Present' : '❌ Missing');
console.log('🔑 API Key Length:', GOOGLE_API_KEY?.length);

// Helper function to generate IDs
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Debug endpoint to check API key
app.get('/api/debug', (req, res) => {
  res.json({
    apiKeyLoaded: !!GOOGLE_API_KEY,
    apiKeyLength: GOOGLE_API_KEY?.length,
    environment: process.env.NODE_ENV,
    message: 'Debug info'
  });
});

// Search roofing companies endpoint
app.post('/api/search-companies', async (req, res) => {
  try {
    const { city, state } = req.body;

    if (!city || !state) {
      return res.status(400).json({ error: 'City and state are required' });
    }

    console.log(`\n🔍 SEARCH REQUEST: ${city}, ${state}`);
    console.log(`🔑 Using API Key: ${GOOGLE_API_KEY?.substring(0, 20)}...`);

    // Step 1: Geocode the city
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      city + ', ' + state + ', USA'
    )}&key=${GOOGLE_API_KEY}`;

    console.log('📍 Geocoding request...');
    const geoResponse = await axios.get(geoUrl, { timeout: 10000 });
    
    console.log(`📍 Geocode status: ${geoResponse.data.status}`);

    if (geoResponse.data.status !== 'OK' || !geoResponse.data.results || geoResponse.data.results.length === 0) {
      console.log('⚠️ Geocoding failed or no results');
      console.log('📍 Full response:', JSON.stringify(geoResponse.data).substring(0, 200));
      return res.json({ companies: [], source: 'fallback', message: `Geocoding failed: ${geoResponse.data.status}` });
    }

    const { lat, lng } = geoResponse.data.results[0].geometry.location;
    console.log(`✅ Found: ${lat}, ${lng}`);

    // Step 2: Search for roofing contractors using Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=20000&keyword=roofing&key=${GOOGLE_API_KEY}`;

    console.log('🏢 Places API request...');
    const placesResponse = await axios.get(placesUrl, { timeout: 10000 });

    console.log(`🏢 Places status: ${placesResponse.data.status}`);
    console.log(`🏢 Results found: ${placesResponse.data.results?.length || 0}`);

    if (placesResponse.data.status !== 'OK' || !placesResponse.data.results || placesResponse.data.results.length === 0) {
      console.log('📝 Trying text search fallback...');
      return await textSearchRoofing(res, city, state, lat, lng);
    }

    // Transform results
    const companies = placesResponse.data.results.slice(0, 20).map((place) => {
      const address = place.formatted_address || place.vicinity || '';
      const addressParts = address.split(',');

      return {
        id: genId(),
        companyName: place.name || 'Roofing Company',
        streetAddress: addressParts[0] || place.vicinity || '',
        city: city,
        state: state,
        zip: '',
        phone: place.formatted_phone_number || place.international_phone_number || '',
        email: '',
        website: place.website || '',
        status: 'Not Visited',
        interest: '',
        supplier: '',
        attemptCount: 0,
        lastVisit: null,
        lastContact: '',
        contactTitle: '',
        notes: place.rating ? `Rating: ${place.rating}/5 (${place.user_ratings_total} reviews)` : 'Added from Google Places',
        accessType: 'Unknown',
        priority: 3,
        followUpDate: null,
      };
    });

    console.log(`✅ Returning ${companies.length} companies\n`);
    res.json({ companies, source: 'google_places', message: `Found ${companies.length} roofing companies` });
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('📋 Full error:', error.response?.data || error);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data?.error_message || 'Unknown error',
      companies: [] 
    });
  }
});

// Text search as fallback
async function textSearchRoofing(res, city, state, lat, lng) {
  try {
    const query = `roofing contractors ${city} ${state}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&location=${lat},${lng}&radius=25000&key=${GOOGLE_API_KEY}`;

    console.log('📝 Text search request...');
    const response = await axios.get(url, { timeout: 10000 });

    console.log(`📝 Text search status: ${response.data.status}`);
    console.log(`📝 Results found: ${response.data.results?.length || 0}`);

    if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
      console.log('❌ Text search returned no results\n');
      return res.json({ companies: [], source: 'no_results', message: 'No roofing companies found in this area' });
    }

    const companies = response.data.results.slice(0, 15).map((place) => ({
      id: genId(),
      companyName: place.name,
      streetAddress: place.formatted_address?.split(',')[0] || 'Address not available',
      city: city,
      state: state,
      zip: '',
      phone: place.formatted_phone_number || '',
      email: '',
      website: place.website || '',
      status: 'Not Visited',
      interest: '',
      supplier: '',
      attemptCount: 0,
      lastVisit: null,
      lastContact: '',
      contactTitle: '',
      notes: place.rating ? `Rating: ${place.rating}/5` : 'Added from search',
      accessType: 'Unknown',
      priority: 3,
      followUpDate: null,
    }));

    console.log(`✅ Returning ${companies.length} companies from text search\n`);
    res.json({ companies, source: 'text_search', message: `Found ${companies.length} roofing companies` });
  } catch (error) {
    console.error('❌ Text search error:', error.message);
    res.status(500).json({ error: 'Text search failed: ' + error.message, companies: [] });
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RoofRoute server is running',
    apiKeyPresent: !!GOOGLE_API_KEY,
    apiKeyValid: GOOGLE_API_KEY?.startsWith('AIzaSy')
  });
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏗 RoofRoute Server running`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`✅ Ready to search for roofing companies!\n`);
});

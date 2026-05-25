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

// Google API Key
const GOOGLE_API_KEY = 'AIzaSyD4DOCU4kvOM5gzBzv12gU-wp91o65dbGI';

// Helper function to generate IDs
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Search roofing companies endpoint
app.post('/api/search-companies', async (req, res) => {
  try {
    const { city, state } = req.body;

    if (!city || !state) {
      return res.status(400).json({ error: 'City and state are required' });
    }

    console.log(`Searching for roofing companies in ${city}, ${state}`);

    // Step 1: Geocode the city
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      city + ', ' + state + ', USA'
    )}&key=${GOOGLE_API_KEY}`;

    const geoResponse = await axios.get(geoUrl);

    if (geoResponse.data.results.length === 0) {
      return res.json({ companies: [], source: 'fallback' });
    }

    const { lat, lng } = geoResponse.data.results[0].geometry.location;
    console.log(`Found coordinates: ${lat}, ${lng}`);

    // Step 2: Search for roofing contractors using Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=20000&keyword=roofing&key=${GOOGLE_API_KEY}`;

    const placesResponse = await axios.get(placesUrl);

    if (!placesResponse.data.results || placesResponse.data.results.length === 0) {
      console.log('No results from Places API, trying text search');
      return await textSearchRoofing(res, city, state, lat, lng);
    }

    // Transform results
    const companies = placesResponse.data.results.map((place) => {
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

    console.log(`Returning ${companies.length} companies`);
    res.json({ companies, source: 'google_places' });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed: ' + error.message });
  }
});

// Text search as fallback
async function textSearchRoofing(res, city, state, lat, lng) {
  try {
    const query = `roofing contractors ${city} ${state}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&location=${lat},${lng}&radius=25000&key=${GOOGLE_API_KEY}`;

    const response = await axios.get(url);

    if (!response.data.results || response.data.results.length === 0) {
      return res.json({ companies: [], source: 'no_results' });
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

    res.json({ companies, source: 'text_search' });
  } catch (error) {
    console.error('Text search error:', error.message);
    res.status(500).json({ error: 'Text search failed' });
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoofRoute server is running' });
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏗 RoofRoute Server running at http://localhost:${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`✅ Ready to search for roofing companies!\n`);
});

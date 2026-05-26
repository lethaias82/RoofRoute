const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Google API Key
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyD4DOCU4kvOM5gzBzv12gU-wp91o65dbGI';

console.log('✅ Server starting...');
console.log('🔑 API Key:', GOOGLE_API_KEY ? 'present' : 'missing');

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Search endpoint
app.post('/api/search-companies', async (req, res) => {
  try {
    const { city, state } = req.body;

    if (!city || !state) {
      return res.status(400).json({ error: 'City and state required', companies: [] });
    }

    console.log(`\n🔍 Search: ${city}, ${state}`);

    // Try text search first (most reliable)
    try {
      const query = `roofing ${city} ${state}`;
      const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      
      const response = await axios.get(textUrl, { timeout: 8000 });
      
      if (response.data.status === 'OK' && response.data.results?.length > 0) {
        const companies = response.data.results.slice(0, 20).map(place => ({
          id: genId(),
          companyName: place.name,
          streetAddress: place.formatted_address?.split(',')[0] || '',
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
          notes: place.rating ? `Rating: ${place.rating}/5` : '',
          accessType: 'Unknown',
          priority: 3,
          followUpDate: null,
        }));

        console.log(`✅ Found ${companies.length}`);
        return res.json({ companies, source: 'text_search' });
      }
    } catch (err) {
      console.log('Text search error:', err.message);
    }

    // Fallback: geocode + nearby
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', ' + state)}&key=${GOOGLE_API_KEY}`;
      const geoRes = await axios.get(geoUrl, { timeout: 8000 });

      if (geoRes.data.status === 'OK' && geoRes.data.results[0]) {
        const { lat, lng } = geoRes.data.results[0].geometry.location;

        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=15000&keyword=roofing&key=${GOOGLE_API_KEY}`;
        const placesRes = await axios.get(placesUrl, { timeout: 8000 });

        if (placesRes.data.status === 'OK' && placesRes.data.results?.length > 0) {
          const companies = placesRes.data.results.slice(0, 20).map(place => ({
            id: genId(),
            companyName: place.name,
            streetAddress: place.vicinity?.split(',')[0] || '',
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
            notes: place.rating ? `Rating: ${place.rating}/5` : '',
            accessType: 'Unknown',
            priority: 3,
            followUpDate: null,
          }));

          console.log(`✅ Found ${companies.length}`);
          return res.json({ companies, source: 'nearby_search' });
        }
      }
    } catch (err) {
      console.log('Nearby search error:', err.message);
    }

    res.json({ companies: [], source: 'none' });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message, companies: [] });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiKey: GOOGLE_API_KEY ? 'loaded' : 'missing' });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server ready\n`);
});

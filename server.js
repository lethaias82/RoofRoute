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
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyD4DOCU4kvOM5gzBzv12gU-wp91o65dbGI';

console.log('✅ Server starting...');
console.log('🔑 API Key present:', !!GOOGLE_API_KEY);

// Helper function to generate IDs
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Search roofing companies endpoint
app.post('/api/search-companies', async (req, res) => {
  try {
    const { city, state } = req.body;

    if (!city || !state) {
      return res.status(400).json({ error: 'City and state are required', companies: [] });
    }

    console.log(`\n🔍 Search: ${city}, ${state}`);

    // Try multiple search strategies
    
    // Strategy 1: Direct text search (simplest)
    try {
      const query = `roofing ${city} ${state}`;
      const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      
      console.log('📝 Trying text search...');
      const response = await axios.get(textUrl, { timeout: 8000 });
      
      console.log(`Status: ${response.data.status}, Results: ${response.data.results?.length || 0}`);

      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
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

        console.log(`✅ Found ${companies.length} companies`);
        return res.json({ companies, source: 'text_search' });
      }
    } catch (err) {
      console.log('Text search failed:', err.message);
    }

    // Strategy 2: Geocode then nearby search
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', ' + state)}&key=${GOOGLE_API_KEY}`;
      const geoRes = await axios.get(geoUrl, { timeout: 8000 });

      if (geoRes.data.status === 'OK' && geoRes.data.results[0]) {
        const { lat, lng } = geoRes.data.results[0].geometry.location;
        console.log(`📍 Geocoded to ${lat}, ${lng}`);

        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=15000&keyword=roofing&key=${GOOGLE_API_KEY}`;
        const placesRes = await axios.get(placesUrl, { timeout: 8000 });

        console.log(`Status: ${placesRes.data.status}, Results: ${placesRes.data.results?.length || 0}`);

        if (placesRes.data.status === 'OK' && placesRes.data.results && placesRes.data.results.length > 0) {
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

          console.log(`✅ Found ${companies.length} companies via nearby search`);
          return res.json({ companies, source: 'nearby_search' });
        }
      }
    } catch (err) {
      console.log('Nearby search failed:', err.message);
    }

    // No results from any strategy
    console.log('❌ No results from any search strategy');
    res.json({ companies: [], source: 'none', message: 'No roofing companies found' });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({ 
      error: error.message,
      companies: [] 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiKey: GOOGLE_API_KEY ? 'present' : 'missing'
  });
});

// Serve app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅ Server ready on port ${PORT}\n`);
});

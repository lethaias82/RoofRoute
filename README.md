# 🏗 RoofRoute - Roofing Sales CRM App

A full-stack field sales canvassing CRM for roofing contractors with **real company data** pulled from Google Places API.

## ✨ Features

- **Real-time Company Search** - Search for actual roofing companies by city/state
- **Google Places Integration** - Pulls real data including ratings, phone numbers, websites
- **Route Management** - Organize companies by territory
- **Visit Logging** - Track all interactions and follow-ups
- **Dashboard Analytics** - View stats and performance metrics
- **Local Storage** - All data saved locally in browser

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed on your computer
- npm (comes with Node.js)

### Installation

1. **Extract the files** to a folder called `roofroute`

2. **Open terminal/command prompt** in that folder

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

That's it! 🎉

## 📱 How to Use

### Searching for Companies

1. Click the **Route** tab
2. Click the **🔍 Search** button
3. Enter a city (e.g., "Melbourne", "Tampa", "Orlando")
4. Select your state
5. Click **Search** → Real roofing companies appear!
6. Check the ones you want and click **Add**

### Logging Visits

1. Click on a company in your route
2. Click **Log Visit**
3. Fill in the details (contact name, status, notes, etc.)
4. Click **Save Visit**

### Managing Your Territory

1. Go to **Home** tab
2. Enter your city/territory name
3. Your companies will filter by that territory
4. Click any recent city to jump to it

### Viewing Analytics

1. Go to **Dashboard** tab
2. See statistics by status
3. Track total companies and visits

## 🔧 Tech Stack

- **Frontend:** React 18 (vanilla, no build step needed)
- **Backend:** Node.js + Express
- **API:** Google Places API
- **Data:** LocalStorage (browser-based)

## 📂 File Structure

```
roofroute/
├── server.js              # Node.js backend server
├── package.json           # Dependencies
└── public/
    └── index.html         # React app (frontend)
```

## 🌐 Deployment (Optional)

To deploy this app online so you can access it anywhere:

### Option 1: Heroku (Free)
1. Create Heroku account at https://heroku.com
2. Install Heroku CLI
3. Run: `heroku create` then `git push heroku main`

### Option 2: Render.com (Free)
1. Push code to GitHub
2. Connect to Render.com
3. Deploy in 1 click

### Option 3: Railway (Free)
1. Connect GitHub account
2. Deploy this repository
3. Get live URL instantly

## 🔐 API Key

Your Google API key is already embedded in the app. If you need to change it:
1. Open `server.js`
2. Find the line: `const GOOGLE_API_KEY = '...'`
3. Replace with your own Google Places API key from: https://console.cloud.google.com

## 💾 Data & Privacy

- **All data is stored locally** in your browser (no cloud sync)
- No personal data is sent to any servers except Google Places API
- To backup your data: Go to More → Export Data
- To restore: Go to More → Import from JSON file

## 🐛 Troubleshooting

### "Search returns no results"
- Make sure you spelled the city correctly
- Try a larger city (small towns may have limited data)
- Check your internet connection

### "Server won't start"
- Make sure Node.js is installed: `node --version`
- Make sure you ran `npm install` first
- Try different port: `PORT=4000 npm start`

### "Can't connect to localhost:3000"
- Make sure server is running (you should see "✅ Ready to search...")
- Try clearing browser cache (Ctrl+Shift+Delete)
- Make sure nothing else is using port 3000

## 📞 Support

For questions or issues:
1. Check troubleshooting section above
2. Verify Node.js is properly installed
3. Make sure all files are in the same folder

## 📝 License

MIT - Feel free to use and modify for your business

---

**Happy routing! 🚀**

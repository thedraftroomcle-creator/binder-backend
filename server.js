const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Your eBay Partner Network Campaign ID 
const CAMP_ID = '1234567890'; 
// IMPORTANT: Put your ScraperAPI key here
const SCRAPER_API_KEY = 'YOUR_SCRAPER_API_KEY_HERE'; 

app.get('/api/cards', async (req, res) => {
  try {
    const ebaySearchUrl = 'https://www.ebay.com/sch/i.html?_nkw=vintage+sports+card+lot';
    
    // We are using premium=true to force ScraperAPI to use high-quality residential proxies.
    // This perfectly mimics a real human and bypasses DataDome completely.
    const targetUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(ebaySearchUrl)}&premium=true`;
    
    const { data } = await axios.get(targetUrl);
    const $ = cheerio.load(data);
    const cards = [];

    // Loop through the actual eBay HTML listings to get high-res images
    $('.s-item').each((index, element) => {
      if (index === 0) return; // Skip eBay's hidden meta-listing

      const title = $(element).find('.s-item__title').text();
      const price = $(element).find('.s-item__price').text();
      const image = $(element).find('.s-item__image-img').attr('src');
      const originalLink = $(element).find('.s-item__link').attr('href');

      if (title && image && originalLink && price) {
        const cleanUrl = originalLink.split('?')[0];
        const affiliateUrl = `${cleanUrl}?mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${CAMP_ID}&toolid=10001`;

        cards.push({
          id: index.toString(),
          title,
          price,
          image,
          url: affiliateUrl
        });
      }
    });

    res.json(cards);
  } catch (error) {
    console.error("ScraperAPI Error Details:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch cards via ScraperAPI' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Binder scraper backend running on port ${PORT}`));

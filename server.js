const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Your eBay Partner Network Campaign ID 
const CAMP_ID = '1234567890'; 
// Add your ScraperAPI Key here
const SCRAPER_API_KEY = '74b64b19cf1d897e9286204be09ca2e3';

app.get('/api/cards', async (req, res) => {
  try {
    const targetUrl = 'https://www.ebay.com/sch/i.html?_nkw=vintage+sports+card+lot';
    
    // Route the request through ScraperAPI to bypass cloud IP blocks
    const { data } = await axios.get('http://api.scraperapi.com/', {
      params: {
        api_key: SCRAPER_API_KEY,
        url: targetUrl,
        premium: 'true' // Guarantees a high-quality residential IP
      }
    });

    const $ = cheerio.load(data);
    const cards = [];

    $('.s-item').each((index, element) => {
      if (index === 0) return; 

      const title = $(element).find('.s-item__title').text().trim();
      const price = $(element).find('.s-item__price').text().trim();
      const image = $(element).find('.s-item__image-img').attr('src');
      const originalLink = $(element).find('.s-item__link').attr('href');

      if (title && price && image && originalLink) {
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
    console.error("Error scraping eBay:", error.message);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Binder scraper backend running on port ${PORT}`));

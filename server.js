const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Your eBay Partner Network Campaign ID 
const CAMP_ID = '1234567890'; 

app.get('/api/cards', async (req, res) => {
  try {
    // THE RSS BYPASS: Appending &_rss=1 tells eBay to send XML meant for automated feed readers.
    // DataDome bot protection completely ignores RSS feeds!
    const targetUrl = 'https://www.ebay.com/sch/i.html?_nkw=vintage+sports+card+lot&_rss=1';
    
    // We hit eBay directly from Render - no ScraperAPI needed!
    const { data } = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    // Parse the XML feed
    const $ = cheerio.load(data, { xmlMode: true });
    const cards = [];

    // Loop through each item in the RSS feed
    $('item').each((index, element) => {
      const title = $(element).find('title').text();
      const originalLink = $(element).find('link').text();
      const descriptionHtml = $(element).find('description').text();
      
      // The description contains HTML with the image and price. We parse it:
      const $desc = cheerio.load(descriptionHtml);
      const image = $desc('img').attr('src');
      
      // Extract the price using a regular expression (e.g., "$15.99")
      const priceMatch = descriptionHtml.match(/\$[0-9,]+\.[0-9]{2}/);
      const price = priceMatch ? priceMatch[0] : 'Check Price';

      if (title && image && originalLink) {
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
    console.error("Error fetching eBay RSS:", error.message);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Binder scraper backend running on port ${PORT}`));

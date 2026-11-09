const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Your eBay Partner Network Campaign ID (Replace with yours when you have it)
const CAMP_ID = '1234567890'; 

app.get('/api/cards', async (req, res) => {
  try {
    // The exact search URL we want to scrape
    const searchUrl = 'https://www.ebay.com/sch/i.html?_nkw=vintage+sports+card+lot';
    
    // We spoof a real browser user-agent so eBay doesn't block our server
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const cards = [];

    // Loop through every listing card on the page
    $('.s-item').each((index, element) => {
      if (index === 0) return; // eBay hides a blank template item in the first slot; skip it

      const title = $(element).find('.s-item__title').text().trim();
      const price = $(element).find('.s-item__price').text().trim();
      const image = $(element).find('.s-item__image-img').attr('src');
      const originalLink = $(element).find('.s-item__link').attr('href');

      if (title && price && image && originalLink) {
        // Strip off eBay's tracking junk and attach your own EPN affiliate tags
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Binder scraper backend running on port ${PORT}`));
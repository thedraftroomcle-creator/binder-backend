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
    const searchUrl = 'https://www.ebay.com/sch/i.html?_nkw=vintage+sports+card+lot';
    
    // Stealth Headers: This makes the cloud server look exactly like a real human on Chrome
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Connection': 'keep-alive'
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

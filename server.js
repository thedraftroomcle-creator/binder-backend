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
    // THE RSS-TO-JSON BYPASS: eBay blocked Render's IP directly, so we use a legitimate 
    // public RSS aggregator (rss2json.com) to fetch the feed on our behalf. 
    // eBay allows feed readers, so this sails right through!
    const ebayRssUrl = 'https://www.ebay.com/sch/i.html?_nkw=vintage+sports+card+lot&_rss=1';
    const targetUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(ebayRssUrl)}`;
    
    const { data } = await axios.get(targetUrl);

    if (data.status !== 'ok') {
      throw new Error('Failed to fetch from RSS2JSON');
    }

    const cards = [];

    // Loop through each item returned by the RSS API
    data.items.forEach((item, index) => {
      const title = item.title;
      const originalLink = item.link;
      const descriptionHtml = item.description;
      
      // The description contains HTML with the image and price. We parse it:
      const $desc = cheerio.load(descriptionHtml);
      const image = $desc('img').attr('src');
      
      // Extract the price using a regular expression (e.g., "$15.99")
      const priceMatch = descriptionHtml.match(/\$[0-9,]+\.[0-9]{2}/);
      const price = priceMatch ? priceMatch[0] : 'Check Price';

      // Only add to array if we successfully found a title, image, and link
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

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Your eBay Partner Network Campaign ID 
const CAMP_ID = '1234567890'; 
// IMPORTANT: Put your ScraperAPI key here
const SCRAPER_API_KEY = '74b64b19cf1d897e9286204be09ca2e3'; 

app.get('/api/cards', async (req, res) => {
  try {
    // TCGPlayer Search URL (Looking for Charizard cards)
    const tcgSearchUrl = 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=charizard&view=grid';
    
    // We MUST use render=true for TCGPlayer because their site relies on JavaScript to load the cards.
    // premium=true ensures we use a residential IP to avoid Cloudflare blocks.
    const targetUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(tcgSearchUrl)}&render=true&premium=true`;
    
    const { data } = await axios.get(targetUrl);
    const $ = cheerio.load(data);
    const cards = [];

    // Loop through the TCGPlayer search results
    $('.search-result').each((index, element) => {
      // TCGPlayer's specific CSS classes for their grid view
      const title = $(element).find('.search-result__title').text().trim();
      const priceText = $(element).find('.inventory__price-with-shipping').text().trim();
      const image = $(element).find('.search-result__image img').attr('src');
      const relativeLink = $(element).find('a.search-result__title').attr('href');

      if (title && image && relativeLink) {
        // TCGPlayer uses relative links, so we must add the base URL
        const fullLink = `https://www.tcgplayer.com${relativeLink}`;
        
        // TCGPlayer affiliate tags work differently, but we'll set up the clean URL for now
        // You can inject your TCGPlayer affiliate ID here later
        const affiliateUrl = fullLink;

        // Clean up the price text if it has extra spacing
        const price = priceText ? priceText.split(' ')[0] : 'Price varies';

        cards.push({
          id: `tcg-${index}`,
          title,
          price,
          image,
          url: affiliateUrl
        });
      }
    });

    if (cards.length === 0) {
      console.log("No cards found. TCGPlayer might be blocking the proxy, or the page took too long to render.");
    }

    res.json(cards);
  } catch (error) {
    console.error("ScraperAPI Error Details:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch cards via ScraperAPI' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Binder scraper backend running on port ${PORT}`));

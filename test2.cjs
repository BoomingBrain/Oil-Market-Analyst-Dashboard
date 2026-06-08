const cheerio = require('cheerio');

async function run() {
  const res = await fetch("https://rigcount.bakerhughes.com/na-rig-count");
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href && (href.includes('rig') || text.includes('Count') || text.includes('Data') || text.includes('North America'))) {
      console.log(text, '->', href);
    }
  });
}

run().catch(console.error);

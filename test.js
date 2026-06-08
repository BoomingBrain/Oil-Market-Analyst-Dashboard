import * as cheerio from 'cheerio';
fetch('https://rigcount.bakerhughes.com/na-rig-count')
  .then(r => r.text())
  .then(html => { 
    const $ = cheerio.load(html); 
    console.log("TABLE 1 TEXT:");
    console.log($('table').first().text().substring(0, 1000)); 
    console.log("\nTABLE 2 TEXT:");
    console.log($('table').eq(1).text().substring(0, 1000)); 
  });

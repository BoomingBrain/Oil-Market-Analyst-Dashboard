const cheerio = require('cheerio');
const xlsx = require('xlsx');

async function run() {
  console.log("Fetching Baker Hughes rig count page...");
  const res = await fetch("https://rigcount.bakerhughes.com/na-rig-count");
  const html = await res.text();
  const $ = cheerio.load(html);
  
  let excelUrl = "";
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text();
    // Look for North America Rotary Rig Count link
    if (href && href.includes('.xlsx') && text.includes('North America Rotary Rig Count')) {
      excelUrl = href;
    }
    // Also look for just .xlsx if the name changed
    if (!excelUrl && href && href.includes('na_rig_count')) {
      excelUrl = href;
    }
  });

  if (!excelUrl) {
    // fallback brute force search for any .xlsx
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!excelUrl && href && href.includes('.xlsx')) {
        excelUrl = href;
      }
    });
  }

  if (!excelUrl.startsWith('http')) {
    excelUrl = 'https://rigcount.bakerhughes.com' + excelUrl;
  }

  console.log("Found Excel URL:", excelUrl);

  const excelRes = await fetch(excelUrl);
  const arrayBuffer = await excelRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log("Downloaded Excel buffer size:", buffer.length);

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  console.log("First sheet name:", sheetName);
  
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Dump top 20 rows to understand structure
  console.log("Top 20 rows:");
  data.slice(0, 20).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
  });
}

run().catch(console.error);

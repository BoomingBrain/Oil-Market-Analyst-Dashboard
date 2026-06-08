const xlsx = require('xlsx');

async function run() {
  const url = "https://rigcount.bakerhughes.com/static-files/e98bcf83-c458-4a88-8f35-4ac4d77628bb";
  console.log("Fetching", url);
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  console.log("SheetName:", sheetName);
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  data.slice(0, 15).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
  });
}

run().catch(console.error);

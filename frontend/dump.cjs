const fs = require('fs');
try {
  const c = fs.readFileSync('./src/pages/Admin.jsx', 'utf8');
  console.log("File size:", c.length);
  const lines = c.split(/\r?\n/);
  for (let i = 645; i < 685; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
} catch(e) { console.error(e) }

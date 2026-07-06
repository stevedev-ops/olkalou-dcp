const fs = require('fs');

let content = fs.readFileSync('src/pages/Members.jsx', 'utf8');

// 1. Replace the ternary
content = content.replace('{!isAdmin ? (', '{!isAdmin && (');

// 2. Remove the privacy shield and else block
const privacyRegex = /<div className="bg-slate-900 text-white[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*\)\s*:\s*\(/;
content = content.replace(privacyRegex, '</div>)}');

// 3. Keep the table. Since it's no longer in an else block, we need to remove the closing )} at the end of the file.
const eofRegex = /\)\}\s*<\/section>/;
content = content.replace(eofRegex, '</section>');

fs.writeFileSync('src/pages/Members.jsx', content);
console.log('Fixed Members.jsx');

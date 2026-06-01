const fs = require('fs');
const path = './src/components/KoreaMap.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replaceAll(
  'bg-white border-2 border-slate-350 text-[#333840] rounded-xl p-5',
  'bg-white border border-slate-100 text-[#333840] rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully styled KoreaMap wrapper.');

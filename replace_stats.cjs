const fs = require('fs');
const path = './src/components/StatsCards.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replaceAll(
  'bg-white border-2 border-[#a5b0ba] rounded-lg p-5',
  'bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully styled StatsCards.');

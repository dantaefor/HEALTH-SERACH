const fs = require('fs');
const path = './src/components/SmartSearchBoard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replaceAll(
  'bg-white text-[#181d26] border border-[#dddddd] shadow-xs',
  'bg-white text-indigo-700 border-none shadow-sm shadow-indigo-100'
);

content = content.replaceAll(
  'bg-slate-100 p-1 rounded-lg border border-[#dddddd]',
  'bg-slate-100 p-1.5 rounded-xl border-none shadow-inner'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully styled tabs.');

const fs = require('fs');
const path = './src/components/ChartsView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replaceAll(
  'bg-white border-2 border-[#a5b0ba] rounded-2xl p-5 h-[520px] flex flex-col select-none shadow-sm',
  'bg-white border border-slate-100 rounded-3xl p-5 h-[520px] flex flex-col select-none shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'
);

content = content.replaceAll(
  'flex bg-slate-200 border-2 border-[#a5b0ba] rounded-xl p-1',
  'flex bg-slate-100 border-none rounded-xl p-1.5 shadow-inner'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully styled ChartsView.');

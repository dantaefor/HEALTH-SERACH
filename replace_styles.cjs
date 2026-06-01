const fs = require('fs');

const path = './src/components/SmartSearchBoard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Container replacments
content = content.replaceAll(
  'bg-white border border-[#dddddd] rounded-lg',
  'bg-white rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'
);

content = content.replaceAll(
  'bg-white border-2 border-[#a5b0ba] rounded-2xl',
  'bg-white rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'
);

// Input field replacements
content = content.replaceAll(
  'bg-slate-50 border-2 border-[#a5b0ba] rounded-lg',
  'bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium'
);

// Search spec top
content = content.replaceAll(
  'border-b border-slate-100 pb-3',
  'border-b border-indigo-50 pb-3'
);

// Slider sub-cards
content = content.replaceAll(
  'bg-white border border-[#dddddd] p-2 rounded-lg shadow-2xs',
  'bg-white border border-slate-50 shadow-sm p-2 rounded-xl'
);
content = content.replaceAll(
  'bg-indigo-50/50 rounded-xl p-3 border border-indigo-100',
  'bg-indigo-50/50 rounded-2xl p-4 border border-indigo-50'
);

// Result cards mode 1
content = content.replaceAll(
  'border-xl border-[#dddddd] rounded-2xl bg-white p-5 shadow-sm',
  'border-none bg-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'
);
content = content.replaceAll(
  'bg-[#181d26] border text-white p-4',
  'bg-gradient-to-br from-indigo-900 to-indigo-800 text-white p-4 shadow-md border-none'
);
content = content.replaceAll(
  'bg-white border border-slate-200 p-3',
  'bg-slate-50 border-none shadow-sm p-3 rounded-2xl'
);
content = content.replaceAll(
  'border border-slate-200 bg-slate-50 p-3.5',
  'bg-white border border-slate-100 shadow-sm p-3.5 rounded-2xl'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully styled SmartSearchBoard matching mode to soft UI.');

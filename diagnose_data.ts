import fetch from "node-fetch";

async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/1Jd4Nzzv6htVuzm6WcGUj2WJLeZbvVbNiWxWddkLZAls/gviz/tq?tqx=out:csv&sheet=RAW%20DATA';
  const res = await fetch(url);
  const text = await res.text();

  function parseCSVLine(line: string) {
    const values: string[] = [];
    let value = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(value);
        value = '';
      } else {
        value += char;
      }
    }
    values.push(value);
    return values;
  }

  function parseCSV(text: string) {
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === '\n' && !insideQuotes) {
        lines.push(currentLine);
        currentLine = '';
        continue;
      }
      currentLine += char;
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  const lines = parseCSV(text);
  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/\s+/g, ' ').trim());

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const projectName = values[2];
    if (projectName && projectName.includes("2842")) {
      console.log(`\nFound target case at line ${i + 1}:`);
      headers.forEach((h, idx) => {
        console.log(`- ${h}: "${values[idx]}"`);
      });
    }
  }
}

run().catch(console.error);

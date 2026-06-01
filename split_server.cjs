const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

// The marker where the express app ends and server initialization begins
const marker = 'export default app;';
const markerIndex = content.indexOf(marker);

const appContent = content.substring(0, markerIndex + marker.length);
fs.writeFileSync('app.ts', appContent, 'utf8');

const serverContent = `import app from "./app.js";
import path from "path";
import express from "express";

const PORT = 3000;

async function initServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const viteModuleName = "vite";
    const { createServer: createViteServer } = await import(viteModuleName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://0.0.0.0:\${PORT}\`);
  });
}

initServer();
`;

fs.writeFileSync('server.ts', serverContent, 'utf8');
console.log('Successfully split server.ts into app.ts and server.ts');

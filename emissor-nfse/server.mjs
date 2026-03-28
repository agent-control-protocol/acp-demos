import { createServer } from "@acprotocol/server";
import OpenAI from "openai";
import { createServer as createHttpServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Load .env file (zero dependencies) ---
const envPath = resolve(__dirname, "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

// --- ACP Server ---
const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is required. Copy ../.env.example to ../.env and edit it.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

const wsPort = parseInt(process.env.ACP_PORT ?? "3109", 10);
const httpPort = parseInt(process.env.ACP_HTTP_PORT ?? "3108", 10);

const acp = createServer({
  openai,
  model: process.env.ACP_MODEL ?? "gpt-4o",
  port: wsPort,
});

await acp.start();
console.log(`ACP server running on ws://localhost:${wsPort}/connect`);

// --- Static HTTP server ---
const htmlRaw = readFileSync(resolve(__dirname, "index.html"), "utf-8");
const jsRaw = readFileSync(resolve(__dirname, "test-app.js"), "utf-8");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

const http = createHttpServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${httpPort}`);
  const path = url.pathname;

  if (path === "/" || path === "/index.html") {
    res.writeHead(200, { "Content-Type": MIME[".html"] });
    res.end(htmlRaw.replace("__ACP_WS_PORT__", String(wsPort)));
  } else if (path === "/test-app.js") {
    res.writeHead(200, { "Content-Type": MIME[".js"] });
    res.end(jsRaw);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

http.listen(httpPort, () => {
  console.log(`Open http://localhost:${httpPort} in your browser`);
});

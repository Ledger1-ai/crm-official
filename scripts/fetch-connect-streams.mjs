#!/usr/bin/env node
/*
Fetches Amazon Connect Streams SDK (connect-streams.js) and vendors it into:
  basaltcrm-app/public/connect/connect-streams.js

Run:
  node basaltcrm-app/scripts/fetch-connect-streams.mjs

Optional environment override:
  CONNECT_STREAMS_SOURCE_URL=https://your-internal-mirror/connect-streams.js
This script will try a sequence of sources and stop at the first that succeeds.
*/

import fs from 'fs';
import path from 'path';
import https from 'https';

const workspaceRoot = path.resolve(path.join(process.cwd()));
const outPath = path.resolve(path.join(workspaceRoot, 'basaltcrm-app', 'public', 'connect', 'connect-streams.js'));

const override = process.env.CONNECT_STREAMS_SOURCE_URL?.trim();
const sources = [
  override || '',
  'https://cdn.connect.aws/connect-streams.js',
  'https://cdn.connect.amazon.com/connect-streams.js',
].filter(Boolean);

function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        res.resume();
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

async function main() {
  if (!sources.length) {
    console.error('[fetch-connect-streams] No sources to try. Set CONNECT_STREAMS_SOURCE_URL or edit the script to include a reachable URL.');
    process.exit(1);
  }
  let lastErr = null;
  for (const src of sources) {
    try {
      console.log(`[fetch-connect-streams] Trying: ${src}`);
      const content = await fetchHttps(src);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, content, 'utf8');
      console.log(`[fetch-connect-streams] Wrote SDK to ${outPath}`);
      console.log('[fetch-connect-streams] Success.');
      return;
    } catch (e) {
      lastErr = e;
      console.warn(`[fetch-connect-streams] Failed from ${src}: ${e?.message || e}`);
    }
  }
  console.error('[fetch-connect-streams] All sources failed.');
  if (lastErr) console.error(lastErr);
  console.error('Hint: Provide CONNECT_STREAMS_SOURCE_URL pointing to an internal mirror or manually copy the SDK into public/connect/connect-streams.js');
  process.exit(2);
}

main().catch((e) => {
  console.error('[fetch-connect-streams] Fatal:', e?.message || e);
  process.exit(3);
});

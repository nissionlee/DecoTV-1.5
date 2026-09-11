import { writeFileSync, readFileSync } from 'fs';

const candidateUrls = [
  'https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/result.m3u',
  'https://raw.githubusercontent.com/yifoo/autoiptv/main/channels/cn.m3u',
];

async function fetchM3U(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AptvPlayer/1.4.10' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return '';
    return await res.text();
  } catch (e) {
    console.warn(`Failed to fetch ${url}: ${e.message}`);
    return '';
  }
}

function parseM3U(text) {
  const lines = text.split('\n');
  const items = [];
  let extinf = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXTINF:')) {
      extinf = trimmed;
    } else if (trimmed && !trimmed.startsWith('#') && extinf) {
      items.push({ extinf, url: trimmed });
      extinf = '';
    }
  }
  return items;
}

async function probeChannel(ch, timeoutMs = 3000) {
  try {
    const res = await fetch(ch.url, {
      headers: {
        'User-Agent': 'AptvPlayer/1.4.10',
        'Accept': '*/*'
      },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!res.ok) return false;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('mpegurl') || contentType.includes('video') || contentType.includes('octet-stream')) {
      return true;
    }
    const sample = (await res.text()).slice(0, 200);
    return sample.includes('#EXTM3U') || sample.includes('#EXTINF');
  } catch {
    return false;
  }
}

async function main() {
  console.log('Fetching candidate M3U sources...');
  const allChannels = [];
  for (const url of candidateUrls) {
    console.log(`Fetching ${url}...`);
    const text = await fetchM3U(url);
    const parsed = parseM3U(text);
    console.log(`Found ${parsed.length} channels from ${url}`);
    allChannels.push(...parsed);
  }

  // Also include the 29 working channels from existing public/live/sports.m3u
  try {
    const localSports = readFileSync('public/live/sports.m3u', 'utf8');
    allChannels.push(...parseM3U(localSports));
  } catch(e) {}

  console.log(`Total candidate channels collected: ${allChannels.length}`);

  // Target channel names we want to support
  const targetKeywords = [
    // Sports
    'CCTV-5', 'CCTV-5+', '风云足球', '广东体育', '天津体育', '江苏体育', '山东体育', '五星体育', '纬来体育', '足球频道', '体育',
    // CCTV Major
    'CCTV-1', 'CCTV-2', 'CCTV-3', 'CCTV-4', 'CCTV-6', 'CCTV-7', 'CCTV-8', 'CCTV-9', 'CCTV-10', 'CCTV-11', 'CCTV-12', 'CCTV-13', 'CCTV-14', 'CCTV-15', 'CCTV-16', 'CCTV-17',
    // Major Provincial
    '湖南卫视', '浙江卫视', '江苏卫视', '东方卫视', '北京卫视', '广东卫视', '深圳卫视', '天津卫视', '安徽卫视', '山东卫视', '河南卫视', '四川卫视', '重庆卫视', '湖北卫视'
  ];

  // Filter channels matching target keywords
  const filtered = [];
  const seenUrls = new Set();

  for (const ch of allChannels) {
    if (seenUrls.has(ch.url)) continue;
    seenUrls.add(ch.url);

    const name = ch.extinf.split(',').pop()?.trim() || '';
    const isTarget = targetKeywords.some(kw => name.includes(kw));
    if (isTarget) {
      filtered.push({ ...ch, name });
    }
  }

  console.log(`Filtered down to ${filtered.length} target sports & mainstream channels for live probing...`);

  const workingByChannel = new Map();
  const queue = [...filtered];
  let processed = 0;

  const workers = Array.from({ length: 25 }, async () => {
    while (queue.length > 0) {
      const ch = queue.shift();
      processed++;
      if (processed % 50 === 0) {
        console.log(`Progress: ${processed}/${filtered.length}...`);
      }

      const existing = workingByChannel.get(ch.name) || [];
      if (existing.length >= 2) continue;

      const isAlive = await probeChannel(ch, 3000);
      if (isAlive) {
        console.log(`[ALIVE] ${ch.name} -> ${ch.url.slice(0, 60)}`);
        existing.push(ch);
        workingByChannel.set(ch.name, existing);
      }
    }
  });

  await Promise.all(workers);

  console.log('\n--- Probing complete! Assembling clean M3U ---');
  let m3uOutput = '#EXTM3U x-tvg-url="https://live.fanmingming.com/e.xml"\n';
  let totalSaved = 0;

  for (const [chName, list] of workingByChannel.entries()) {
    list.forEach((ch, idx) => {
      let ext = ch.extinf;
      if (idx > 0) {
        ext = ext.replace(`,${chName}`, `,${chName} [线路${idx + 1}]`);
      }
      m3uOutput += `${ext}\n${ch.url}\n`;
      totalSaved++;
    });
  }

  writeFileSync('public/live/clean_live.m3u', m3uOutput, 'utf8');
  writeFileSync('public/live/sports.m3u', m3uOutput, 'utf8');
  console.log(`Successfully generated public/live/clean_live.m3u with ${totalSaved} verified working channels across ${workingByChannel.size} stations!`);
}

main().catch(console.error);

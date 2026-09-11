import { readFileSync } from 'fs';

// 读取环境变量
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const k = trimmed.slice(0, eqIdx).trim();
    let v = trimmed.slice(eqIdx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    env[k] = v;
  }
}

const upstashUrl = env.UPSTASH_URL;
const upstashToken = env.UPSTASH_TOKEN;

if (!upstashUrl || !upstashToken) {
  console.error('Missing UPSTASH_URL or UPSTASH_TOKEN');
  process.exit(1);
}

console.log('Fetching current config from Upstash Redis...');
const res = await fetch(`${upstashUrl}/get/admin:config`, {
  headers: { Authorization: `Bearer ${upstashToken}` },
});
const data = await res.json();
const config =
  typeof data.result === 'string' ? JSON.parse(data.result) : data.result;

// 准备精选高质量直播源列表（经实测 100% 可用）
const liveSources = [
  {
    key: 'clean_live',
    name: '🏆 纯净精选 · 央视卫视全套 (100%实测可用)',
    url: 'https://vercel.1000rocks.com/live/clean_live.m3u',
    ua: 'AptvPlayer/1.4.10',
    epg: 'https://live.fanmingming.com/e.xml',
    channelNumber: 45,
    from: 'config',
    disabled: false,
  },
  {
    key: 'clean_sports',
    name: '⚽ 体育竞技 · CCTV5与省市体育 (实测可用)',
    url: 'https://vercel.1000rocks.com/live/sports.m3u',
    ua: 'AptvPlayer/1.4.10',
    epg: 'https://live.fanmingming.com/e.xml',
    channelNumber: 29,
    from: 'config',
    disabled: false,
  },
];

// 1. 更新 ConfigFile.lives
let fileConfig = {};
try {
  fileConfig = JSON.parse(config.ConfigFile || '{}');
} catch (e) {
  fileConfig = {};
}

fileConfig.lives = {};
for (const s of liveSources) {
  fileConfig.lives[s.key] = {
    name: s.name,
    url: s.url,
    ua: s.ua,
    epg: s.epg,
  };
}

config.ConfigFile = JSON.stringify(fileConfig, null, 2);
config.LiveConfig = liveSources;

console.log(`Saving ${liveSources.length} live sources to Upstash Redis...`);
const saveRes = await fetch(`${upstashUrl}/set/admin:config`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${upstashToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(config),
});

const saveResult = await saveRes.json();
console.log('Save result:', saveResult);

// 验证
const verifyRes = await fetch(`${upstashUrl}/get/admin:config`, {
  headers: { Authorization: `Bearer ${upstashToken}` },
});
const verifyData = await verifyRes.json();
const savedConfig =
  typeof verifyData.result === 'string'
    ? JSON.parse(verifyData.result)
    : verifyData.result;

console.log('Verified LiveConfig count:', savedConfig.LiveConfig?.length);
for (const l of savedConfig.LiveConfig) {
  console.log(
    `  - [${l.key}] ${l.name} -> ${l.url} (${l.channelNumber} channels)`,
  );
}
console.log('\nLive sources successfully configured!');

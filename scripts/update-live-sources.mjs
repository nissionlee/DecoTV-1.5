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

// 准备精选高质量直播源列表（特别侧重体育直播、咪咕专线、央视卫视体育与国际赛事）
const liveSources = [
  {
    key: 'migu_sports',
    name: '⚽ 咪咕体育赛事专线',
    url: 'https://raw.githubusercontent.com/YanG-1989/m3u/main/Gather.m3u',
    ua: 'AptvPlayer/1.4.10',
    epg: 'https://material.1989.click/epg.xml.gz',
    channelNumber: 127,
    from: 'config',
    disabled: false,
  },
  {
    key: 'guovin_sports_iptv',
    name: '🏆 央视卫视与全国体育直播',
    url: 'https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/result.m3u',
    ua: 'AptvPlayer/1.4.10',
    epg: 'https://gh-proxy.com/https://raw.githubusercontent.com/Guovin/iptv-api/refs/heads/master/output/epg/epg.gz',
    channelNumber: 1619,
    from: 'config',
    disabled: false,
  },
  {
    key: 'global_sports',
    name: '🌍 全球体育竞技频道',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    ua: 'AptvPlayer/1.4.10',
    epg: '',
    channelNumber: 368,
    from: 'config',
    disabled: false,
  },
  {
    key: 'suxuang_iptv',
    name: '📡 IPv6超清电视及体育',
    url: 'https://raw.githubusercontent.com/suxuang/myIPTV/main/ipv6.m3u',
    ua: 'AptvPlayer/1.4.10',
    epg: 'https://live.fanmingming.com/e.xml',
    channelNumber: 914,
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

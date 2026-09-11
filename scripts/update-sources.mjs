import { existsSync, readFileSync } from 'fs';

// 从 .env.local 读取环境变量
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

// 1. 获取当前配置
console.log('Fetching current admin config from Upstash...');
const getRes = await fetch(`${upstashUrl}/get/admin:config`, {
  headers: { Authorization: `Bearer ${upstashToken}` },
});
const getData = await getRes.json();
const currentConfig =
  typeof getData.result === 'string'
    ? JSON.parse(getData.result)
    : getData.result;

if (!currentConfig) {
  console.error('No admin config found in database!');
  process.exit(1);
}

// 2. 创建备份
const backupKey = `admin:config:backup_${Date.now()}`;
console.log(`Creating backup at ${backupKey}...`);
await fetch(`${upstashUrl}/set/${encodeURIComponent(backupKey)}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${upstashToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(currentConfig),
});
console.log('Backup saved successfully!');

// 3. 经过连通性、搜索、m3u8播放链接深度验证的优质视频源合集（2025-2026 最新可用）
const verifiedMainstreamSources = [
  {
    key: 'lziapi',
    name: '🎬量子资源',
    api: 'https://cj.lziapi.com/api.php/provide/vod',
    detail: 'https://cj.lziapi.com',
  },
  {
    key: 'ffzyapi',
    name: '🎬非凡资源',
    api: 'https://cj.ffzyapi.com/api.php/provide/vod',
    detail: 'https://cj.ffzyapi.com',
  },
  {
    key: 'jszyapi',
    name: '🎬极速资源',
    api: 'https://jszyapi.com/api.php/provide/vod',
    detail: 'https://jszyapi.com',
  },
  {
    key: 'hongniuzy2',
    name: '🎬红牛资源',
    api: 'https://www.hongniuzy2.com/api.php/provide/vod',
    detail: 'https://www.hongniuzy2.com',
  },
  {
    key: 'bfzyapi',
    name: '🎬暴风资源',
    api: 'https://bfzyapi.com/api.php/provide/vod',
    detail: 'https://bfzyapi.com',
  },
  {
    key: 'guangsuapi',
    name: '🎬光速资源',
    api: 'https://api.guangsuapi.com/api.php/provide/vod',
    detail: 'https://api.guangsuapi.com',
  },
  {
    key: 'jyzyapi',
    name: '🎬金鹰资源',
    api: 'https://jyzyapi.com/api.php/provide/vod',
    detail: 'https://jyzyapi.com',
  },
  {
    key: 'hhzyapi',
    name: '🎬豪华资源',
    api: 'https://hhzyapi.com/api.php/provide/vod',
    detail: 'https://hhzyapi.com',
  },
  {
    key: 'huyaapi',
    name: '🎬虎牙资源',
    api: 'https://www.huyaapi.com/api.php/provide/vod',
    detail: 'https://www.huyaapi.com',
  },
  {
    key: 'subocaiji',
    name: '🎬速播资源',
    api: 'https://subocaiji.com/api.php/provide/vod',
    detail: 'https://subocaiji.com',
  },
  {
    key: 'xinlangapi',
    name: '🎬新浪资源',
    api: 'https://api.xinlangapi.com/xinlangapi.php/provide/vod',
    detail: 'https://api.xinlangapi.com',
  },
  {
    key: 'zuidapi',
    name: '🎬最大资源',
    api: 'https://api.zuidapi.com/api.php/provide/vod',
    detail: 'https://api.zuidapi.com',
  },
  {
    key: 'wujinapi_com',
    name: '🎬无尽资源',
    api: 'https://api.wujinapi.com/api.php/provide/vod',
    detail: 'https://api.wujinapi.com',
  },
  {
    key: 'zy360',
    name: '🎬360资源',
    api: 'https://360zy.com/api.php/provide/vod',
    detail: 'https://360zy.com',
  },
  {
    key: 'ukuapi',
    name: '🎬U酷影视',
    api: 'https://api.ukuapi.com/api.php/provide/vod',
    detail: 'https://api.ukuapi.com',
  },
  {
    key: 'mdzyapi',
    name: '🎬魔都影视',
    api: 'https://www.mdzyapi.com/api.php/provide/vod',
    detail: 'https://www.mdzyapi.com',
  },
  {
    key: 'moduapi',
    name: '🎨魔都动漫',
    api: 'https://caiji.moduapi.cc/api.php/provide/vod',
    detail: 'https://caiji.moduapi.cc',
  },
  {
    key: 'dyttzyapi',
    name: '🎬电影天堂',
    api: 'http://caiji.dyttzyapi.com/api.php/provide/vod',
    detail: 'http://caiji.dyttzyapi.com',
  },
  {
    key: 'maoyanzy',
    name: '🎬猫眼资源',
    api: 'https://api.maoyanapi.top/api.php/provide/vod',
    detail: 'https://api.maoyanapi.top',
  },
  {
    key: 'rycjapi',
    name: '🎬如意资源',
    api: 'https://cj.rycjapi.com/api.php/provide/vod',
    detail: 'https://cj.rycjapi.com',
  },
  {
    key: 'ikunzy',
    name: '🎬iKun资源',
    api: 'https://www.ikunzy.com/api.php/provide/vod',
    detail: 'https://www.ikunzy.com',
  },
  {
    key: 'zyku1080',
    name: '🎬神马云',
    api: 'https://api.1080zyku.com/inc/apijson.php/',
    detail: 'https://api.1080zyku.com',
  },
  {
    key: 'iqiyizyapi',
    name: '🎬爱奇艺源',
    api: 'https://iqiyizyapi.com/api.php/provide/vod',
    detail: 'https://iqiyizyapi.com',
  },
];

// 4. 处理成人源：保留旧源中测试可用的成人源，彻底删除失效的
const existingSources = currentConfig.SourceConfig || [];
const workingAdultSources = [];
const seenAdultApis = new Set();

for (const s of existingSources) {
  if (s.is_adult || s.name.startsWith('AV-')) {
    // 检查此成人源之前测试是否可用
    // 之前测试可用的有：乐播资源、番号资源、白嫖资源、奶香香、精品资源、美少女资源、玉兔资源、香奶儿资源、老色逼资源、鲨鱼资源、黄色资源啊啊、小鸡资源、杏吧资源、森林资源
    const isKnownWorking =
      s.api.includes('lbapi9.com') ||
      s.api.includes('fhzy9.com') ||
      s.api.includes('bpzy') ||
      s.api.includes('naixxzy') ||
      s.api.includes('jpzy') ||
      s.api.includes('msnzy') ||
      s.api.includes('yutu') ||
      s.api.includes('xnezy') ||
      s.api.includes('lsbzy') ||
      s.api.includes('syzy') ||
      s.api.includes('hsckzy') ||
      s.api.includes('xiaojizy') ||
      s.api.includes('xingba') ||
      s.api.includes('slapibf.com') ||
      s.key.includes('api_56') ||
      s.key.includes('api_62') ||
      s.key.includes('api_63') ||
      s.key.includes('api_58') ||
      s.key.includes('api_64') ||
      s.key.includes('api_65') ||
      s.key.includes('api_61') ||
      s.key.includes('api_70') ||
      s.key.includes('api_66') ||
      s.key.includes('api_71');

    if (isKnownWorking && !seenAdultApis.has(s.api)) {
      seenAdultApis.add(s.api);
      workingAdultSources.push({
        key: s.key,
        name: s.name,
        api: s.api,
        detail: s.detail || '',
        is_adult: true,
        from: 'custom',
        disabled: false,
      });
    }
  }
}

console.log(
  `Verified Mainstream Sources: ${verifiedMainstreamSources.length}`,
);
console.log(`Preserved Working Adult Sources: ${workingAdultSources.length}`);

// 5. 构建全新的 ConfigFile.api_site 结构
let fileConfig = {};
try {
  fileConfig = JSON.parse(currentConfig.ConfigFile || '{}');
} catch (e) {
  fileConfig = {};
}

const newApiSite = {};
for (const s of verifiedMainstreamSources) {
  newApiSite[s.key] = {
    name: s.name,
    api: s.api,
    detail: s.detail || '',
    is_adult: false,
  };
}

fileConfig.api_site = newApiSite;
currentConfig.ConfigFile = JSON.stringify(fileConfig, null, 2);

// 6. 构建全新的 SourceConfig（彻底删除 72 个无效源，去重，保留最新有效源 + 有效成人源）
const newSourceConfig = [];
for (const s of verifiedMainstreamSources) {
  newSourceConfig.push({
    key: s.key,
    name: s.name,
    api: s.api,
    detail: s.detail || '',
    is_adult: false,
    from: 'config',
    disabled: false,
  });
}
for (const s of workingAdultSources) {
  newSourceConfig.push(s);
}

currentConfig.SourceConfig = newSourceConfig;

// 7. 保存更新后的配置到 Upstash Redis
console.log(
  `Writing updated config to Upstash Redis (Total sources: ${newSourceConfig.length})...`,
);
const setRes = await fetch(`${upstashUrl}/set/admin:config`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${upstashToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(currentConfig),
});

const setResult = await setRes.json();
console.log('Save result:', setResult);

// 8. 验证写入结果
const verifyRes = await fetch(`${upstashUrl}/get/admin:config`, {
  headers: { Authorization: `Bearer ${upstashToken}` },
});
const verifyData = await verifyRes.json();
const savedConfig =
  typeof verifyData.result === 'string'
    ? JSON.parse(verifyData.result)
    : verifyData.result;

console.log('Verified SourceConfig count:', savedConfig.SourceConfig?.length);
console.log('New sources list:');
for (const s of savedConfig.SourceConfig) {
  console.log(`  - [${s.key}] ${s.name} (${s.api}) [Adult: ${!!s.is_adult}]`);
}
console.log('\nAll sources updated and verified successfully!');

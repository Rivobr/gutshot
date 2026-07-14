import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dirname, '..', '.env'), 'utf8');
const token = envRaw
  .split(/\r?\n/)
  .find((l) => l.startsWith('TELEGRAM_BOT_TOKEN='))
  ?.slice('TELEGRAM_BOT_TOKEN='.length)
  .trim();

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN не найден в .env');
  process.exit(1);
}

const user = {
  id: 777000001,
  first_name: 'Демо',
  last_name: 'Игрок',
  username: 'demo_player',
};

const params = new URLSearchParams();
params.set('user', JSON.stringify(user));
params.set('auth_date', String(Math.floor(Date.now() / 1000)));

const dataCheckString = Array.from(params.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `${k}=${v}`)
  .join('\n');

const secretKey = createHmac('sha256', 'WebAppData').update(token).digest();
const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
params.set('hash', hash);

const initData = params.toString();

const res = await fetch('http://localhost:3000/api/v1/auth/telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData }),
});

const json = await res.json();
if (!json?.data?.accessToken) {
  console.error('Ошибка авторизации:', JSON.stringify(json));
  process.exit(1);
}

console.log('ACCESS_TOKEN=' + json.data.accessToken);

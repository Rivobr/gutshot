#!/usr/bin/env python3
import os, time, json, hmac, hashlib, base64, subprocess, urllib.request, urllib.parse, sys

ENV = {}
with open('/opt/gutshot/.env') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        ENV[k.strip()] = v.strip()

JWT_SECRET = ENV['JWT_SECRET']
BOT = ENV['TELEGRAM_BOT_TOKEN']
PG_USER = ENV.get('POSTGRES_USER', 'gutshot')
PG_DB = ENV.get('POSTGRES_DB', 'gutshot')

ENTRY_BASE = 'https://app.gutshotapp.ru/enter.html'
VERSION = '20260807f'

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def sign_ticket(telegram_id: str) -> str:
    now = int(time.time())
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {'typ': 'miniapp_ticket', 'telegramId': str(telegram_id),
               'iat': now, 'exp': now + 7 * 24 * 3600}
    seg = b64url(json.dumps(header, separators=(',', ':')).encode()) + '.' + \
          b64url(json.dumps(payload, separators=(',', ':')).encode())
    sig = hmac.new(JWT_SECRET.encode(), seg.encode(), hashlib.sha256).digest()
    return seg + '.' + b64url(sig)

def get_users():
    sql = ("SELECT \"telegramId\", COALESCE(\"firstName\",'') FROM \"User\" "
           "WHERE \"isBlocked\"=false AND \"telegramId\" ~ '^[0-9]+$' "
           "AND length(\"telegramId\")>=6 "
           "AND \"telegramId\" NOT IN ('000000001','999000111') "
           "ORDER BY \"createdAt\" DESC;")
    out = subprocess.check_output(
        ['docker', 'exec', '-i', 'gutshot-postgres', 'psql', '-U', PG_USER,
         '-d', PG_DB, '-tA', '-F', '\t', '-c', sql]).decode()
    users = []
    for line in out.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split('\t')
        users.append((parts[0], parts[1] if len(parts) > 1 else ''))
    return users

def tg(method: str, body: dict):
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{BOT}/{method}',
        data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def entry_url(ticket: str) -> str:
    q = urllib.parse.urlencode({'v': VERSION, 't': int(time.time() * 1000), 'ticket': ticket})
    return f'{ENTRY_BASE}?{q}'

def validate(sample_id: str) -> bool:
    ticket = sign_ticket(sample_id)
    req = urllib.request.Request(
        'http://127.0.0.1:3000/api/v1/auth/telegram/ticket',
        data=json.dumps({'ticket': ticket}).encode(),
        headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
        ok = bool(data.get('data', {}).get('accessToken'))
        print('validate ticket:', 'OK' if ok else 'NO TOKEN', json.dumps(data)[:160])
        return ok
    except urllib.error.HTTPError as e:
        print('validate HTTP error', e.code, e.read().decode()[:200])
        return False

TEXT = ('♠️ <b>GUTSHOT снова онлайн</b>\n'
        'Вход в клуб восстановлен. Нажми кнопку ниже, чтобы открыть приложение.\n\n'
        'Если крутится загрузка — полностью закрой Telegram (смахни из недавних) '
        'и открой бота заново.')

def main():
    users = get_users()
    print(f'recipients: {len(users)}')
    if not users:
        print('no users'); return
    if not validate(users[0][0]):
        print('ABORT: ticket did not validate, not sending'); sys.exit(1)

    sent = 0; failed = 0; errors = []
    for tid, name in users:
        ticket = sign_ticket(tid)
        body = {
            'chat_id': int(tid),
            'text': TEXT,
            'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[
                {'text': '♠️ Открыть клуб', 'web_app': {'url': entry_url(ticket)}}]]},
        }
        for attempt in range(3):
            try:
                res = tg('sendMessage', body)
                if res.get('ok'):
                    sent += 1
                else:
                    failed += 1; errors.append((tid, str(res)[:120]))
                break
            except urllib.error.HTTPError as e:
                raw = e.read().decode()
                if e.code == 429:
                    try:
                        after = json.loads(raw).get('parameters', {}).get('retry_after', 2)
                    except Exception:
                        after = 2
                    time.sleep(after + 1); continue
                failed += 1; errors.append((tid, f'{e.code} {raw[:100]}')); break
            except Exception as e:
                if attempt == 2:
                    failed += 1; errors.append((tid, str(e)[:100]))
                else:
                    time.sleep(1)
        time.sleep(0.08)

    print(f'DONE sent={sent} failed={failed}')
    for tid, err in errors:
        print('  FAIL', tid, err)

if __name__ == '__main__':
    main()

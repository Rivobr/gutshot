#!/usr/bin/env python3
"""RSVP-рассылка записанным на Wednesday Freeroll: кнопки Буду / Не смогу + лог message_id."""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

ENV = {}
with open('/opt/gutshot/.env') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        ENV[k.strip()] = v.strip()

BOT = ENV['TELEGRAM_BOT_TOKEN']
PG_USER = ENV.get('POSTGRES_USER', 'gutshot')
PG_DB = ENV.get('POSTGRES_DB', 'gutshot')

TOURNAMENT_ID = 'cmsfedi6x00056ups9ymzznoz'
OUT_DIR = '/opt/gutshot/data'
OUT_FILE = os.path.join(OUT_DIR, 'rsvp-wed-freeroll-2026-08-12-messages.json')

TEXT = (
    '♠️ <b>Wednesday Freeroll — сегодня</b>\n'
    '\n'
    'Подтверди, пожалуйста, участие.\n'
    '📅 Сегодня, 12 августа · 16:00\n'
    '🎟 Вход — 0₽\n'
    '\n'
    'Если не сможешь — нажми «Не смогу», чтобы освободить место.'
)


def get_registered():
    sql = f"""
SELECT u.\"telegramId\",
       COALESCE(NULLIF(u.nickname,''), NULLIF(u.\"firstName\",''), u.\"telegramId\"),
       r.id,
       u.id
FROM \"Registration\" r
JOIN \"User\" u ON u.id = r.\"userId\"
WHERE r.\"tournamentId\" = '{TOURNAMENT_ID}'
  AND r.status = 'REGISTERED'
  AND u.\"isBlocked\" = false
  AND u.\"telegramId\" ~ '^[0-9]+$'
ORDER BY r.\"registeredAt\";
"""
    out = subprocess.check_output(
        [
            'docker', 'exec', '-i', 'gutshot-postgres',
            'psql', '-U', PG_USER, '-d', PG_DB, '-tA', '-F', '\t', '-c', sql,
        ]
    ).decode()
    rows = []
    for line in out.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split('\t')
        rows.append({
            'telegramId': parts[0],
            'name': parts[1] if len(parts) > 1 else parts[0],
            'registrationId': parts[2] if len(parts) > 2 else '',
            'userId': parts[3] if len(parts) > 3 else '',
        })
    return rows


def tg(method: str, body: dict):
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{BOT}/{method}',
        data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    dry = '--dry-run' in sys.argv
    users = get_registered()
    print(f'registered recipients: {len(users)} dry_run={dry} tournament={TOURNAMENT_ID}')
    if not users:
        print('no registered users')
        return
    if dry:
        for u in users:
            print(f"  {u['telegramId']}\t{u['name']}")
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    sent = []
    failed = []

    for u in users:
        body = {
            'chat_id': int(u['telegramId']),
            'text': TEXT,
            'parse_mode': 'HTML',
            'disable_web_page_preview': True,
            'reply_markup': {
                'inline_keyboard': [[
                    {
                        'text': '✅ Буду',
                        'callback_data': f'rsvp:y:{TOURNAMENT_ID}',
                    },
                    {
                        'text': '❌ Не смогу',
                        'callback_data': f'rsvp:n:{TOURNAMENT_ID}',
                    },
                ]],
            },
        }
        ok = False
        last_err = ''
        for attempt in range(3):
            try:
                res = tg('sendMessage', body)
                if res.get('ok'):
                    result = res['result']
                    sent.append({
                        'telegramId': u['telegramId'],
                        'name': u['name'],
                        'userId': u['userId'],
                        'registrationId': u['registrationId'],
                        'chatId': result.get('chat', {}).get('id'),
                        'messageId': result.get('message_id'),
                        'sentAt': datetime.now(timezone.utc).isoformat(),
                    })
                    ok = True
                    break
                last_err = str(res)[:160]
                break
            except urllib.error.HTTPError as e:
                raw = e.read().decode()
                if e.code == 429:
                    try:
                        after = json.loads(raw).get('parameters', {}).get('retry_after', 2)
                    except Exception:
                        after = 2
                    time.sleep(after + 1)
                    continue
                last_err = f'{e.code} {raw[:120]}'
                break
            except Exception as e:
                last_err = str(e)[:120]
                time.sleep(1)
        if not ok:
            failed.append({**u, 'error': last_err})
        time.sleep(0.08)

    payload = {
        'tournamentId': TOURNAMENT_ID,
        'tournamentTitle': 'Wednesday Freeroll',
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'sentCount': len(sent),
        'failedCount': len(failed),
        'messages': sent,
        'failures': failed,
    }
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f'DONE sent={len(sent)} failed={len(failed)}')
    print(f'message ids saved: {OUT_FILE}')
    for row in sent:
        print(f"  msg={row['messageId']}\tchat={row['chatId']}\t{row['name']}\t{row['telegramId']}")
    for row in failed:
        print(f"  FAIL {row['telegramId']} {row['name']} {row.get('error','')}")


if __name__ == '__main__':
    main()

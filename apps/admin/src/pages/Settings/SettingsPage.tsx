import { useState } from 'react';
import { Button, Card } from '@gutshot/ui';
import { printNumberPlate } from '../../shared/lib/print-number-plate';

const CLUB_INFO = [
  { label: 'Название клуба', value: 'GUTSHOT Poker Club' },
  { label: 'Адрес', value: 'Санкт-Петербург, Миллионная улица, 19' },
  { label: 'Телефон', value: '+7 999 009-11-99' },
  { label: 'ИНН', value: '781140907760' },
  { label: 'Юр. лицо', value: 'ИП Миронов Михаил Александрович' },
  { label: 'Поддержка', value: '@gutshot_suport' },
  { label: 'Часовой пояс', value: 'Europe/Moscow (UTC+3)' },
];

const LINKS = [
  { label: 'Mini App игрока', href: 'https://app.gutshotapp.ru' },
  { label: 'Админка', href: 'http://admin.gutshotapp.ru' },
  {
    label: 'Запас: админка по IP',
    href: 'http://159.194.208.116:8081',
  },
  { label: 'API', href: '/api/v1' },
];

export function SettingsPage(): JSX.Element {
  const [plateNumber, setPlateNumber] = useState('4999');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium sm:text-2xl">Настройки клуба</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3">
          <p className="text-sm font-medium">Клуб</p>
          {CLUB_INFO.map((row) => (
            <div key={row.label}>
              <p className="text-sm text-muted-foreground">{row.label}</p>
              <p className="font-medium">{row.value}</p>
            </div>
          ))}
        </Card>

        <Card className="gap-3">
          <p className="text-sm font-medium">Сервисы</p>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary"
            >
              <span>{link.label}</span>
              <span className="text-muted-foreground">↗</span>
            </a>
          ))}
        </Card>

        <Card className="gap-3 lg:col-span-2">
          <p className="text-sm font-medium">Печать таблички GUTSHOT</p>
          <p className="text-sm text-muted-foreground">
            Золотая рамка с цифрой — как наклейка 40×40 мм (тот же принтер, что QR) или лист 40×40
            см.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className="relative mx-auto shrink-0 overflow-hidden sm:mx-0"
              style={{
                width: 148,
                height: 148,
                background: 'radial-gradient(ellipse at 50% 40%, #1c160e 0%, #090909 72%)',
                border: '3px solid #c89a3d',
                boxShadow:
                  'inset 0 0 0 2px #7d5417, inset 0 0 0 5px #090909, inset 0 0 0 6px #f7d98a',
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              <div
                className="absolute inset-x-0 flex flex-col items-center"
                style={{ top: 14, gap: 2 }}
              >
                <span className="flex items-end" style={{ height: 8, gap: 2 }}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <i
                      key={index}
                      className="block"
                      style={{
                        width: 3,
                        height: 8,
                        borderRadius: 2,
                        background:
                          index === 2
                            ? 'linear-gradient(180deg, #7a0b2c 0%, #e0115f 45%, #ff4d7d 60%, #a10d3d 100%)'
                            : 'linear-gradient(180deg, #7d5417 0%, #c89a3d 42%, #f7d98a 58%, #8a5c1c 100%)',
                      }}
                    />
                  ))}
                </span>
                <p
                  className="text-center"
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.22em',
                    color: '#f7d98a',
                    fontWeight: 700,
                  }}
                >
                  GUTSHOT
                </p>
              </div>
              <p
                className="absolute inset-x-0 text-center font-semibold"
                style={{
                  top: 52,
                  fontSize: 36,
                  lineHeight: 1,
                  background: 'linear-gradient(180deg, #9c6a1f 0%, #f7d98a 45%, #c89a3d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {plateNumber.trim() || '4999'}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Цифра</span>
                <input
                  value={plateNumber}
                  onChange={(event) =>
                    setPlateNumber(event.target.value.replace(/[^\d]/g, '').slice(0, 6))
                  }
                  inputMode="numeric"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-medium tracking-widest"
                />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={() => printNumberPlate(plateNumber, '40mm')}>
                  Печать 40×40 мм
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => printNumberPlate(plateNumber, '40cm')}
                >
                  Печать 40×40 см
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="gap-2 lg:col-span-2">
          <p className="text-sm font-medium">Установка на телефон</p>
          <p className="text-sm text-muted-foreground">
            Админ-панель работает как приложение. На Android откройте меню браузера и выберите
            «Установить приложение», на iPhone — «Поделиться» → «На экран «Домой»». После установки
            панель открывается на весь экран, без адресной строки.
          </p>
        </Card>
      </div>
    </div>
  );
}

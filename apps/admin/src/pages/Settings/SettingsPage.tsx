import { Card } from '@gutshot/ui';

const CLUB_INFO = [
  { label: 'Название клуба', value: 'GUTSHOT Poker Club' },
  { label: 'Адрес', value: 'Санкт-Петербург, Миллионная улица, 19' },
  { label: 'Часовой пояс', value: 'Europe/Moscow (UTC+3)' },
];

const LINKS = [
  { label: 'Mini App игрока', href: 'https://app.gutshotapp.ru' },
  { label: 'Табло турнира (TV)', href: 'https://tv.gutshotapp.ru' },
  { label: 'API', href: 'https://api.gutshotapp.ru/api/v1' },
];

export function SettingsPage(): JSX.Element {
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

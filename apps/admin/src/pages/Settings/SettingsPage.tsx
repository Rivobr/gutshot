import { Card } from '@gutshot/ui';

const CLUB = {
  name: 'GUTSHOT Poker Club',
  address: 'Санкт-Петербург, ул. Миллионная, 19',
  phone: '+7 999 009-11-99',
  inn: '781140907760',
  legalName: 'ИП Миронов Михаил Александрович',
  support: '@gutshot_suport',
  timezone: 'Europe/Moscow (UTC+3)',
} as const;

export function SettingsPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Настройки клуба</h1>
      <Card className="max-w-lg gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Название клуба</p>
          <p className="font-medium">{CLUB.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Адрес</p>
          <p className="font-medium">{CLUB.address}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Телефон</p>
          <p className="font-medium">{CLUB.phone}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">ИНН</p>
          <p className="font-medium">{CLUB.inn}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Юр. лицо</p>
          <p className="font-medium">{CLUB.legalName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Поддержка</p>
          <p className="font-medium">{CLUB.support}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Часовой пояс</p>
          <p className="font-medium">{CLUB.timezone}</p>
        </div>
      </Card>
    </div>
  );
}

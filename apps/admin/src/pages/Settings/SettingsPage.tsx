import { Card } from '@gutshot/ui';

export function SettingsPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Настройки клуба</h1>
      <Card className="max-w-lg gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Название клуба</p>
          <p className="font-medium">GUTSHOT Poker Club</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Адрес</p>
          <p className="font-medium">Санкт-Петербург</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Часовой пояс</p>
          <p className="font-medium">Europe/Moscow (UTC+3)</p>
        </div>
      </Card>
    </div>
  );
}

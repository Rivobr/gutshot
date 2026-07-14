import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Avatar, Button, Card } from '@gutshot/ui';
import { apiClient } from '../../shared/api/client';
import { QrScanner } from '../../widgets/QrScanner/QrScanner';

async function checkIn(token: string) {
  const { data } = await apiClient.post('/admin/check-in', { token });
  return data.data;
}

export function CheckInPage(): JSX.Element {
  const [token, setToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const mutation = useMutation({ mutationFn: checkIn });

  const handleScan = useCallback(
    (scannedToken: string) => {
      setScanning(false);
      setToken(scannedToken);
      mutation.mutate(scannedToken);
    },
    [mutation],
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Check-In</h1>
      <p className="text-sm text-muted-foreground">
        Отсканируйте QR-код игрока камерой устройства или введите токен вручную.
      </p>

      <Card className="max-w-md gap-3">
        <Button variant={scanning ? 'secondary' : 'primary'} onClick={() => setScanning((v) => !v)}>
          {scanning ? 'Остановить камеру' : 'Сканировать камерой'}
        </Button>

        {scanning && <QrScanner active={scanning} onScan={handleScan} />}

        <div className="flex flex-col gap-2">
          <input
            className="rounded-md border border-border bg-secondary px-3 py-2.5"
            placeholder="Токен QR-кода"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <Button
            isLoading={mutation.isPending}
            disabled={!token}
            onClick={() => mutation.mutate(token)}
          >
            Подтвердить Check-In
          </Button>
        </div>
      </Card>

      {mutation.isSuccess && (
        <Card className="max-w-md flex-row items-center gap-4">
          <Avatar
            src={mutation.data.player.photoUrl}
            fallback={`${mutation.data.player.firstName ?? ''} ${mutation.data.player.lastName ?? ''}`}
            size={56}
          />
          <div>
            <p className="font-medium">
              {mutation.data.player.firstName} {mutation.data.player.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{mutation.data.tournament.title}</p>
            <p className="text-sm text-primary">Успешно отметился</p>
          </div>
        </Card>
      )}

      {mutation.isError && (
        <p className="text-sm text-destructive">Не удалось выполнить Check-In. Проверьте токен.</p>
      )}
    </div>
  );
}

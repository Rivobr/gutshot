import type { TournamentLiveState } from '@gutshot/types';

function formatSeconds(total: number | null | undefined): string {
  if (total == null || total < 0) return '—';
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function TournamentLiveBlock({ live }: { live: TournamentLiveState }): JSX.Element {
  if (!live.isRunning && live.level == null && live.smallBlind == null) {
    return <></>;
  }

  const blinds =
    live.smallBlind != null && live.bigBlind != null
      ? `${live.smallBlind}/${live.bigBlind}${live.ante ? ` (${live.ante})` : ''}`
      : '—';

  return (
    <div
      className="vip-card rounded-[18px] p-4"
      style={{
        border: '1px solid rgba(199,154,61,0.28)',
        background: 'linear-gradient(145deg, rgba(199,154,61,0.12), rgba(14,12,9,0.96))',
      }}
    >
      <p
        className="sans uppercase mb-3"
        style={{ fontSize: 10, color: '#C89A3D', letterSpacing: '0.16em', fontWeight: 600 }}
      >
        {live.isRunning ? '● Идёт турнир' : 'Live'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <LiveStat label="Уровень" value={live.level != null ? String(live.level) : '—'} />
        <LiveStat label="Блайнды" value={blinds} />
        <LiveStat label="До перерыва" value={formatSeconds(live.nextBreakInSec)} />
        <LiveStat label="Играют" value={live.playersIn != null ? String(live.playersIn) : '—'} />
      </div>
    </div>
  );
}

function LiveStat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p
        className="sans uppercase"
        style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.12em' }}
      >
        {label}
      </p>
      <p className="serif font-semibold mt-1" style={{ fontSize: 18, color: '#F5EDD6' }}>
        {value}
      </p>
    </div>
  );
}

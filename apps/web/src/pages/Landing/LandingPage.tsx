import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { publicApi, type OverallRatingEntry } from '@/shared/api/public.api';
import { Logo } from '@/shared/ui/Logo';
import { formatDateShort, formatTime } from '@/shared/lib/format';
import { useAuth } from '@/app/providers/auth-provider';

export function LandingPage() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ['public-landing'], queryFn: publicApi.landing });
  const nearest = data?.nearestTournament ?? null;
  const club = data?.club;
  const taken = nearest?._count?.registrations ?? 0;
  const max = nearest?.maxPlayers ?? 40;
  const seated = Math.min(taken, max);
  const waiting = Math.max(taken - max, 0);

  return (
    <>
      <div className="glow-bg" />

      <div className="head-spacer" aria-hidden="true" />

      <header className="pub-head">
        <Logo small />
        <nav className="pub-nav">
          <a href="#week">Расписание</a>
          <a href="#rating">Рейтинг</a>
          <a href="#about">О клубе</a>
        </nav>
        {user ? (
          <Link className="btn btn-gold btn-sm" to="/app">
            В клуб ↗
          </Link>
        ) : (
          <Link className="btn btn-gold btn-sm" to="/login">
            Войти
          </Link>
        )}
      </header>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-in">
          <span>
            ♠ Спортивный покер · <b>Миллионная, 19</b>
          </span>
          <span>
            ◆ Сетка недели: <b>СР · ПТ · СБ</b>
          </span>
          <span>
            ✦ Топ-7 недели → <b>финал месяца</b>
          </span>
          <span>
            18+ · Только игра, <b>без ставок</b>
          </span>
          <span>
            ♠ Спортивный покер · <b>Миллионная, 19</b>
          </span>
          <span>
            ◆ Сетка недели: <b>СР · ПТ · СБ</b>
          </span>
          <span>
            ✦ Топ-7 недели → <b>финал месяца</b>
          </span>
          <span>
            18+ · Только игра, <b>без ставок</b>
          </span>
        </div>
      </div>

      <section className="hero-wrap">
        <div className="hero-photo-bg" aria-hidden="true">
          <img src="/hero-bg.webp" alt="" decoding="async" />
          <div className="hero-photo-shade" />
        </div>

        <div className="hero-split">
          <div className="stack-16">
            <span className="eyebrow hero-line" style={{ animationDelay: '0.05s' }}>
              Клуб спортивного покера · Санкт-Петербург
            </span>
            <h1 className="serif hero-title" style={{ animation: 'none' }}>
              <span className="hero-line" style={{ animationDelay: '0.15s' }}>
                Gutshot
              </span>
              <span className="hero-line" style={{ animationDelay: '0.3s' }}>
                спортивный покер
              </span>
              <span className="hero-line gold" style={{ animationDelay: '0.45s' }}>
                не на <em>деньги</em>
              </span>
            </h1>
            <p
              className="muted-strong hero-line"
              style={{ maxWidth: 420, fontSize: 15, animationDelay: '0.6s' }}
            >
              Спортивный покер в центре города: Миллионная, 19. Регулярные турниры, рейтинг сезона,
              финал месяца. Только игра — никаких ставок.
            </p>
            <div className="row wrap mt-8 hero-line" style={{ animationDelay: '0.72s' }}>
              <Link className="btn btn-gold" to={user ? '/app' : '/login'}>
                {user ? 'Войти в кабинет' : 'Войти в клуб'}
              </Link>
              <a className="btn btn-ghost" href="#about">
                Как найти
              </a>
            </div>
            <div
              className="row wrap muted hero-line"
              style={{ fontSize: 11.5, gap: 18, marginTop: 6, animationDelay: '0.84s' }}
            >
              <span>♠ Техасский холдем</span>
              <span>♦ Спортивный рейтинг</span>
              <span>♣ Финал месяца</span>
            </div>
          </div>

          <article className="vip-card" style={{ padding: 26 }}>
            <span className="suit-wm">♠</span>
            <div className="row between wrap mb-16">
              <span className="chip chip-live">● СКОРО</span>
              {nearest && (
                <span className="chip">
                  🕐 {formatDateShort(nearest.date)} / {formatTime(nearest.date)}
                </span>
              )}
            </div>
            <p className="eyebrow">Ближайший турнир</p>
            <h2
              className="serif"
              style={{ fontSize: 30, lineHeight: 1.05, marginTop: 6, textTransform: 'uppercase' }}
            >
              {nearest?.title ?? 'Скоро в клубе'}
            </h2>
            <div className="mt-16 stack-16">
              <div className="row between">
                <span className="muted">Взнос</span>
                <b>{nearest?.buyIn ? `${nearest.buyIn} ₽` : 'Free · вход свободный'}</b>
              </div>
              <div className="row between">
                <span className="muted">Место</span>
                <b>Миллионная, 19</b>
              </div>
              <div>
                <div className="row between mb-8">
                  <span className="muted">Записались</span>
                  <b className="num">
                    {seated} / {max}
                  </b>
                </div>
                <div className="xp-bar">
                  <i style={{ width: `${Math.min(100, Math.round((seated / max) * 100))}%` }} />
                </div>
                {waiting > 0 && (
                  <p className="hint mt-8" style={{ color: 'var(--gold)' }}>
                    +{waiting} в листе ожидания
                  </p>
                )}
              </div>
            </div>
            <Link className="btn btn-gold btn-block mt-24" to={user ? '/app' : '/register'}>
              Записаться
            </Link>
            <p className="center hint mt-12">Запись и личный QR — после входа</p>
          </article>
        </div>
      </section>

      <section className="section" id="week" style={{ paddingTop: 0 }}>
        <span className="eyebrow">Сетка недели</span>
        <h2 className="serif">Играем три раза в неделю</h2>
        <div className="week-grid mt-24" style={{ gap: 14 }}>
          <div className="day hot">
            <b>СР</b>
            <span>19:00 · фриролл</span>
          </div>
          <div className="day hot">
            <b>ПТ</b>
            <span>19:00 · фриролл</span>
          </div>
          <div className="day hot">
            <b>СБ</b>
            <span>17:00 · баунти фриролл</span>
          </div>
        </div>
        <p className="hint mt-12">
          Двери открываются за час до начала. Регистрация заранее гарантирует место.
        </p>
      </section>

      <section className="section" id="rating" style={{ paddingTop: 0 }}>
        <span className="eyebrow">Витрина рейтинга</span>
        <h2 className="serif">Финал месяца</h2>
        <div className="cols-2 mt-24">
          <MonthlyVitrine />
          <GlobalRatingVitrine />
        </div>
        <p className="note gold mt-16" style={{ maxWidth: 720 }}>
          Очки рейтинга ≠ XP. Баунти = 50 очков. XP — только опыт игрока.
        </p>
      </section>

      <section className="section" id="about" style={{ paddingTop: 0 }}>
        <span className="eyebrow">Клуб</span>
        <h2 className="serif">О клубе и как найти</h2>
        <div className="cols-2 mt-24">
          <div className="card stack-16">
            <p className="muted-strong" style={{ fontSize: 13.5 }}>
              GUTSHOT — клуб спортивного покера в историческом центре Петербурга. Комфортные столы,
              профессиональные дилеры, живая атмосфера соревнования. Мы играем ради игры: спорт,
              тактика и сообщество.
            </p>
            <div className="row wrap">
              <a
                className="btn btn-ghost btn-sm"
                href="https://yandex.ru/maps/?text=Санкт-Петербург, Миллионная 19"
                target="_blank"
                rel="noreferrer"
              >
                Маршрут и парковка
              </a>
              <Link className="btn btn-dark btn-sm" to="/install">
                Поставить приложение
              </Link>
            </div>
            <div className="divider">Документы</div>
            <div className="row wrap" style={{ gap: 10 }}>
              <a
                className="chip"
                href="/docs/oferta.pdf"
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                📄 Оферта (скан)
              </a>
              <a
                className="chip"
                href="/docs/policy-pdn.pdf"
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                📄 Политика ПДн (скан)
              </a>
              <a
                className="chip"
                href="/docs/club-rules.pdf"
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                📋 Правила клуба
              </a>
              <span className="chip">📷 Согласие на фото/видео</span>
            </div>
          </div>
          <div
            className="card center"
            style={{ display: 'grid', placeItems: 'center', minHeight: 260 }}
          >
            <div>
              <div style={{ fontSize: 44 }} aria-hidden="true">
                🗺️
              </div>
              <p className="serif" style={{ fontSize: 20, margin: '10px 0 4px' }}>
                Миллионная, 19
              </p>
              <p className="muted">Набережная Мойки · вход со двора</p>
              <a
                className="btn btn-gold btn-sm mt-16"
                href="https://yandex.ru/maps/?text=Санкт-Петербург, Миллионная 19"
                target="_blank"
                rel="noreferrer"
              >
                Открыть маршрут
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="pub-footer">
        <div className="logo logo--sm mb-12">
          <img className="logo-img" src="/gutshot-logo.png" alt="GUTSHOT" />
        </div>
        {club ? (
          <>
            {club.legalName} · ИНН {club.inn}
            <br />
            {club.address} ·{' '}
            <a
              href={`tel:${club.phone.replace(/\s/g, '')}`}
              style={{ color: 'var(--gold)', textDecoration: 'none' }}
            >
              {club.phone}
            </a>
          </>
        ) : (
          <>
            ИП Миронов Михаил Александрович · ИНН 781140907760
            <br />
            Санкт-Петербург, Миллионная ул., 19 · +7 999 009-11-99
          </>
        )}
        <br />
        <span className="muted">
          Спортивный покер. 18+. Не является азартной игрой на деньги. Оферта · Политика ПДн
        </span>
      </footer>
    </>
  );
}

function GlobalRatingVitrine() {
  const { data } = useQuery({ queryKey: ['public-overall'], queryFn: publicApi.overallRating });
  const entries = data?.entries ?? [];

  return (
    <div className="card mt-24">
      <div className="row between wrap mb-16">
        <b className="serif" style={{ fontSize: 17 }}>
          Глобальный рейтинг
        </b>
        <span className="chip">топ по XP · весь клуб</span>
      </div>
      {entries.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>
          Рейтинг пока формируется
        </p>
      ) : (
        <table className="tbl">
          <tbody>
            {entries.map((e: OverallRatingEntry) => (
              <tr key={e.userId}>
                <td className="rank">{e.rank}</td>
                <td>
                  {e.nickname ?? [e.firstName, e.lastName].filter(Boolean).join(' ') ?? 'Игрок'}
                </td>
                <td className="r muted" style={{ fontSize: 11 }}>
                  Ур. {e.level ?? '—'}
                </td>
                <td className="r num">
                  <b>{e.points.toLocaleString('ru-RU')}</b> XP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="hint mt-12">
        XP копится за каждую игру: явка, комбинации, уровни. Полный рейтинг — в приложении клуба.
      </p>
    </div>
  );
}

function MonthlyVitrine() {
  const { data } = useQuery({
    queryKey: ['public-monthly'],
    queryFn: () => publicApi.monthlyRating('current'),
  });
  const entries = data?.entries?.slice(0, 5) ?? [];

  return (
    <div className="card">
      <div className="row between mb-16">
        <b className="serif" style={{ fontSize: 17 }}>
          Финал месяца
        </b>
        <span className="chip chip-ruby">топ-27 месяца</span>
      </div>
      {entries.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>
          В этом месяце пока нет очков
        </p>
      ) : (
        <table className="tbl">
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.userId}>
                <td className="rank">{i + 1}</td>
                <td>
                  {e.nickname ?? [e.firstName, e.lastName].filter(Boolean).join(' ') ?? 'Игрок'}
                </td>
                <td className="r num">
                  <b>{e.points ?? e.weeklyXp ?? 0}</b> очк.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

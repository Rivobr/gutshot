import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LegalDocumentDto, LegalDocumentType } from '@gutshot/types';
import { PageHeader } from '../../widgets/PageHeader/PageHeader';
import { LegalDocumentSheet } from '../../widgets/LegalDocumentSheet/LegalDocumentSheet';
import { InfoCard } from '../../shared/ui/figma';
import { club } from '../../shared/config/club';
import { resolveLegalDocument } from '../../shared/config/legal-document-pages';
import { useLegalDocuments } from '../../entities/player';

const PARAGRAPHS = [
  'GUTSHOT — клуб спортивного покера в Санкт-Петербурге. Мы проводим регулярные турниры по правилам спортивного покера: без ставок на деньги, с зачётом очков в клубный рейтинг.',
  'В клубе действует система уровней и опыта: за участие, финальные столы и победы игрок получает XP, поднимается в ранге и открывает доступ к закрытым сериям.',
];

const INSTAGRAM_GRADIENT =
  'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';

const TIKTOK_GRADIENT =
  'linear-gradient(135deg, #00f2ea 0%, #111111 42%, #111111 58%, #ff0050 100%)';

const ABOUT_DOCUMENTS: { type: LegalDocumentType; kicker: string; title: string }[] = [
  { type: 'USER_AGREEMENT', kicker: 'Документы', title: 'Публичная оферта' },
  {
    type: 'PERSONAL_DATA_CONSENT',
    kicker: 'Документы',
    title: 'Персональные данные',
  },
];

export function AboutPage(): JSX.Element {
  const { data: documents } = useLegalDocuments();
  const [openDocument, setOpenDocument] = useState<LegalDocumentDto | null>(null);
  const documentsByType = new Map<LegalDocumentType, LegalDocumentDto>(
    (documents ?? []).map((document) => [document.type, document]),
  );

  return (
    <PageHeader title="О клубе" subtitle={club.fullName}>
      <div className="flex flex-col gap-4">
        {PARAGRAPHS.map((text, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="sans"
            style={{ fontSize: 13, lineHeight: 1.7, color: '#B6A98F' }}
          >
            {text}
          </motion.p>
        ))}

        <div className="grid grid-cols-2 gap-3 mt-1">
          <InfoCard icon="📍" label="Адрес" value={club.address} />
          <InfoCard icon="🏙" label="Город" value={club.city} />
          <InfoCard icon="📞" label="Телефон" value={club.phone} href={`tel:${club.phoneTel}`} />
          <InfoCard icon="🧾" label="ИНН" value={club.inn} />
        </div>

        <div className="vip-card rounded-[18px] px-5 py-4">
          <p
            className="sans uppercase"
            style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
          >
            Реквизиты
          </p>
          <p className="serif font-semibold mt-1" style={{ fontSize: 15, color: '#F5EDD6' }}>
            {club.legalName}
          </p>
        </div>

        <Link
          to="/directions"
          className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex flex-col">
            <span
              className="sans uppercase"
              style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
            >
              Маршрут
            </span>
            <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
              Как найти Gutshot
            </span>
          </span>
          <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
        </Link>

        <Link
          to="/rules"
          className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex flex-col">
            <span
              className="sans uppercase"
              style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
            >
              Документы
            </span>
            <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
              Правила клуба
            </span>
          </span>
          <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
        </Link>

        {ABOUT_DOCUMENTS.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() =>
              setOpenDocument(resolveLegalDocument(item.type, documentsByType.get(item.type)))
            }
            className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
            style={{
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span className="flex flex-col">
              <span
                className="sans uppercase"
                style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
              >
                {item.kicker}
              </span>
              <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
                {item.title}
              </span>
            </span>
            <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
          </button>
        ))}

        <a
          href={`tel:${club.phoneTel}`}
          className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex flex-col">
            <span
              className="sans uppercase"
              style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
            >
              Позвонить
            </span>
            <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
              {club.phone}
            </span>
          </span>
          <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
        </a>

        <div className="flex flex-col gap-2">
          <a
            href={club.channelUrl}
            target="_blank"
            rel="noreferrer"
            className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
            style={{ textDecoration: 'none' }}
          >
            <span className="flex flex-col">
              <span
                className="sans uppercase"
                style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
              >
                Telegram-канал
              </span>
              <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
                {club.channelUsername}
              </span>
            </span>
            <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
          </a>

          <a
            href={club.chatUrl}
            target="_blank"
            rel="noreferrer"
            className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
            style={{ textDecoration: 'none' }}
          >
            <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
              Чат клуба
            </span>
            <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
          </a>

          <a
            href={club.socials.instagram}
            target="_blank"
            rel="noreferrer"
            className="rounded-[18px] px-5 py-4 flex items-center justify-between"
            style={{
              textDecoration: 'none',
              background: INSTAGRAM_GRADIENT,
              boxShadow: '0 8px 24px rgba(188, 24, 136, 0.28)',
            }}
          >
            <span className="flex flex-col">
              <span
                className="sans uppercase"
                style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.18em' }}
              >
                Instagram
              </span>
              <span className="serif font-semibold" style={{ fontSize: 15, color: '#FFFFFF' }}>
                {club.socials.instagramHandle}
              </span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 20 }}>›</span>
          </a>

          <a
            href={club.socials.tiktok}
            target="_blank"
            rel="noreferrer"
            className="rounded-[18px] px-5 py-4 flex items-center justify-between"
            style={{
              textDecoration: 'none',
              background: TIKTOK_GRADIENT,
              boxShadow: '0 8px 24px rgba(255, 0, 80, 0.22)',
              border: '1px solid rgba(0, 242, 234, 0.35)',
            }}
          >
            <span className="flex flex-col">
              <span
                className="sans uppercase"
                style={{
                  fontSize: 8.5,
                  color: 'rgba(255,255,255,0.75)',
                  letterSpacing: '0.18em',
                }}
              >
                TikTok
              </span>
              <span className="serif font-semibold" style={{ fontSize: 15, color: '#FFFFFF' }}>
                {club.socials.tiktokHandle}
              </span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 20 }}>›</span>
          </a>
        </div>

        <div className="flex justify-center pt-3 pb-1">
          <img
            src="/gutshot-logo.png"
            alt="GUTSHOT"
            width={72}
            height={72}
            style={{ width: 72, height: 72, objectFit: 'contain' }}
          />
        </div>
      </div>
      <LegalDocumentSheet document={openDocument} onClose={() => setOpenDocument(null)} />
    </PageHeader>
  );
}

export const club = {
  name: 'GUTSHOT',
  fullName: 'Клуб спортивного покера GUTSHOT',
  city: 'Санкт-Петербург',
  address: 'Миллионная улица, 19',
  phone: '+7 (812) 000-00-00',
  inn: '0000000000',
  legalName: 'ИП Указать ФИО',
  supportUrl: 'https://t.me/gutshot_support',
  channelUrl: 'https://t.me/gutshot_spb',
  chatUrl: 'https://t.me/gutshot_spb',
  mapsUrl:
    'https://yandex.ru/maps/?text=%D0%A1%D0%B0%D0%BD%D0%BA%D1%82-%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3%2C%20%D0%9C%D0%B8%D0%BB%D0%BB%D0%B8%D0%BE%D0%BD%D0%BD%D0%B0%D1%8F%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%2C%2019',
  socials: {
    telegram: 'https://t.me/gutshot_spb',
    vk: 'https://vk.com/gutshot',
    instagram: 'https://instagram.com/gutshot',
  },
  docs: {
    terms: 'https://gutshotclub.ru/terms',
    clubRules: 'https://gutshotclub.ru/rules',
    privacy: 'https://gutshotclub.ru/privacy',
    media: 'https://gutshotclub.ru/media-consent',
  },
} as const;

export function clubLegalLine(): string {
  return `${club.address} · ИНН ${club.inn} · ${club.legalName}`;
}

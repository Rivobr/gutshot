/** 2 → «2-й» (род. падеж к «недели»). */
function weekGenitive(weekNumber: number): string {
  return `${weekNumber}-й`;
}

function uniqueSorted(weekNumbers?: number[]): number[] {
  return [...new Set(weekNumbers ?? [])].filter((n) => n > 0).sort((a, b) => a - b);
}

/** «финалист 2-й недели», «финалист 1-й и 2-й недели». */
export function formatFinalistWeekLine(weekNumbers?: number[]): string {
  const weeks = uniqueSorted(weekNumbers);
  if (weeks.length === 0) {
    return '';
  }
  if (weeks.length === 1) {
    return `финалист ${weekGenitive(weeks[0])} недели`;
  }
  const last = weeks[weeks.length - 1];
  const head = weeks.slice(0, -1).map(weekGenitive).join(', ');
  return `финалист ${head} и ${weekGenitive(last)} недели`;
}

/** Подпись карточки игрока в финале месяца. */
export function formatFinalistWeekSubtitle(weekNumbers?: number[], fallbackCount = 1): string {
  const weeks = uniqueSorted(weekNumbers);
  if (weeks.length === 1) {
    return `Очки за ${weeks[0]}-ю неделю в топ-7`;
  }
  if (weeks.length > 1) {
    const last = weeks[weeks.length - 1];
    const head = weeks
      .slice(0, -1)
      .map((n) => `${n}-ю`)
      .join(', ');
    return `Сумма очков за ${head} и ${last}-ю недели в топ-7`;
  }
  const count = fallbackCount;
  const noun = count === 1 ? 'неделю' : count < 5 ? 'недели' : 'недель';
  return `Сумма очков за ${count} ${noun} в топ-7`;
}

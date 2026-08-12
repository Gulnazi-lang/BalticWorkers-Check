import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Как мы проверяем — NordicWork Check' };

const statuses = [
  ['Источник подтверждён', 'Оригинальная вакансия найдена, ссылка открывается, работодатель или агентство указаны. Ключевые условия ещё могут быть не подтверждены.'],
  ['Условия подтверждены', 'Работодатель ответил и подтвердил зарплату, график, жильё, транспорт и тип договора. Оплата продвижения не влияет на этот статус.'],
  ['Работник подтвердил', 'Статус выдаётся только после проверяемого отзыва реального работника и не используется на основании одного сообщения или обещания.'],
  ['Проверка нужна', 'Работодатель не идентифицирован, важные условия отсутствуют или информация из разных источников противоречит друг другу.'],
];

export default function HowWeCheckPage() {
  return <main><header className="site-header"><div className="container nav"><a className="brand" href="/"><span className="brand-mark">NW</span><span>NordicWork <em>Check</em></span></a><a className="text-link" href="/">← На главную</a></div></header><section className="section container"><div className="eyebrow">Прозрачная методика</div><h1>Как мы проверяем вакансии</h1><p className="hero-text">Мы разделяем источник, проверку условий и платное продвижение. Ни один работодатель не может купить положительный статус.</p><div className="trust-items method-list">{statuses.map(([title, text], index) => <div key={title}><strong>0{index + 1}</strong><span><b>{title}</b><br />{text}</span></div>)}</div><h2>Что мы не обещаем</h2><p>Мы не гарантируем трудоустройство, визу, налоговый результат или уровень дохода. Мы объясняем опубликованные условия и направляем к оригинальному источнику.</p></section></main>;
}

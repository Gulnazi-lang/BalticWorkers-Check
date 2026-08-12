import type { Metadata } from 'next';
import { jobs } from '../lib/jobs';
import { JobCard } from '../components/jobs/JobCard';

export const metadata: Metadata = {
  title: 'NordicWork Check — Работа в Скандинавии',
  description: 'Понятные условия работы в Швеции и Норвегии для работников из Балтии.',
};

export default function HomePage() {
  return (
    <main>
      <header className="site-header"><div className="container nav"><div className="brand"><span className="brand-mark">NW</span><span>NordicWork <em>Check</em></span></div><nav><a href="#jobs">Вакансии</a><a href="/how-we-check">Как проверяем</a><a href="/services">Помощь</a></nav><button className="language">RU ▾</button></div></header>
      <section className="hero"><div className="container hero-grid"><div><div className="eyebrow">Швеция · Норвегия · Балтия</div><h1>Работа в Скандинавии с понятными условиями</h1><p className="hero-text">Зарплата, жильё, дорога и работодатель — в понятной карточке вакансии.</p><div className="search-box"><input placeholder="Профессия, например: сварщик"/><select defaultValue=""><option value="">Страна</option><option>Швеция</option><option>Норвегия</option></select><button>Найти работу</button></div><div className="hero-note">Бесплатно для соискателей · Отклик через официальный источник</div></div><div className="hero-card"><div className="hero-card-label">Редакционный принцип</div><div className="hero-stat">Не продаём<br />доверие</div><div className="hero-card-title">Оплата продвижения не влияет на результат проверки</div><div className="hero-card-meta">Работодатель может заказать перевод и охват, но не может купить положительный статус.</div><div className="status-pill">Проверка независима</div></div></div></section>
      <section id="jobs" className="section container"><div className="section-heading"><div><div className="eyebrow">Подборка вакансий</div><h2>Последние предложения</h2></div><a className="text-link" href="/jobs">Смотреть все →</a></div>{jobs.length ? <div className="job-grid">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty-state"><h3>Первые вакансии готовятся</h3><p>Мы подключаем источники и проверяем условия вручную. Здесь появятся вакансии с указанием зарплаты, жилья, дороги и работодателя.</p><a className="button" href="/services">Получать обновления</a></div>}</section>
      <section id="how" className="trust-section"><div className="container trust-grid"><div><div className="eyebrow">Почему нам доверяют</div><h2>Проверяем важное до поездки</h2></div><div className="trust-items"><div><strong>01</strong><span>Источник подтверждён — оригинальная вакансия найдена и доступна.</span></div><div><strong>02</strong><span>Условия подтверждены — работодатель ответил и подтвердил ключевые данные.</span></div><div><strong>03</strong><span>Оплата продвижения не влияет на редакционный статус вакансии.</span></div></div></div></section>
      <section id="employer" className="employer-section"><div className="container employer-inner"><div><div className="eyebrow">Для работодателей</div><h2>Нужны работники из Балтии?</h2><p>Переведём вакансию и покажем её целевым кандидатам. Оплата охвата не покупает положительный статус проверки.</p></div><a className="button button-light" href="mailto:hello@nordicwork-check.example">Получить кандидатов</a></div></section>
      <footer><div className="container footer-inner"><span>© 2026 NordicWork Check</span><span>Информационная платформа, не кадровое агентство</span></div></footer>
    </main>
  );
}

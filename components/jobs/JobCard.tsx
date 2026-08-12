import type { Job } from '../../lib/jobs';

const verificationStyles = {
  SOURCE_CONFIRMED: 'verification-source',
  EMPLOYER_CONFIRMED: 'verification-confirmed',
  WORKER_CONFIRMED: 'verification-confirmed',
  NEEDS_REVIEW: 'verification-unknown',
} as const;

export function JobCard({ job }: { job: Job }) {
  const sponsored = job.publicationType === 'SPONSORED';

  return (
    <article className="job-card">
      <div className="card-top">
        <span className="country-tag">{job.country}</span>
        <span className={`verification ${verificationStyles[job.verificationLevel]}`}>
          {job.verificationLabel}
        </span>
      </div>
      <h3>{job.title}</h3>
      <p className="company">{job.company}</p>
      <p className="location">{job.city}</p>
      <div className="salary">{job.salary}<small>{job.salaryNote}</small></div>
      <div className="details">
        <span>⌂ {job.housing}</span>
        <span>→ {job.transport}</span>
        <span>◷ {job.schedule}</span>
      </div>
      <div className="card-footer">
        <span>{sponsored ? 'Промо-публикация · ' : ''}Обновлено {job.updated}</span>
        <a href={job.sourceUrl} target="_blank" rel="noreferrer">Оригинал ↗</a>
      </div>
    </article>
  );
}

import type { Job } from '../../lib/jobs';

export function JobCard({ job }: { job: Job }) {
  return <article className="job-card"><div className="card-top"><span className="country-tag">{job.country}</span><span className={`verification verification-${job.verification}`}>{job.verificationLabel}</span></div><h3>{job.title}</h3><p className="company">{job.company}</p><p className="location">{job.city}</p><div className="salary">{job.salary}<small>{job.salaryNote}</small></div><div className="details"><span>⌂ {job.housing}</span><span>→ {job.transport}</span><span>◷ {job.schedule}</span></div><div className="card-footer"><span>Обновлено {job.updated}</span><a href={job.sourceUrl} target="_blank" rel="noreferrer">Оригинал ↗</a></div></article>;
}
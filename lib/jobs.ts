export type VerificationLevel = 'SOURCE_CONFIRMED' | 'EMPLOYER_CONFIRMED' | 'WORKER_CONFIRMED' | 'NEEDS_REVIEW';
export type PublicationType = 'ORGANIC' | 'SPONSORED' | 'PARTNER';

export type Job = {
  id: string;
  title: string;
  company: string;
  country: string;
  city: string;
  salary: string;
  salaryNote: string;
  housing: string;
  transport: string;
  schedule: string;
  verificationLevel: VerificationLevel;
  publicationType: PublicationType;
  verificationLabel: string;
  updated: string;
  sourceUrl: string;
};

export const jobs: Job[] = [];

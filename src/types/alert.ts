export interface JobAlertRow {
  id: string;
  created_at: string;
  email: string;
  query: string;
  occupation_isco: string | null;
  country: string;
  wage_min_eur: number | null;
  wage_max_eur: number | null;
  confirm_token: string;
  confirmed_at: string | null;
  unsubscribe_token: string;
  unsubscribed_at: string | null;
  last_notified_at: string | null;
}

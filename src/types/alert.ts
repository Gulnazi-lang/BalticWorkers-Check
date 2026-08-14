export interface JobAlertRow {
  id: string;
  created_at: string;
  email: string;
  query: string;
  country: string;
  confirm_token: string;
  confirmed_at: string | null;
  unsubscribe_token: string;
  unsubscribed_at: string | null;
  last_notified_at: string | null;
}

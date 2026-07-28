
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS bills_status_idx ON public.bills (status);
CREATE INDEX IF NOT EXISTS bills_billing_month_idx ON public.bills (billing_month);
CREATE INDEX IF NOT EXISTS tuition_requests_status_idx ON public.tuition_requests (status);
CREATE INDEX IF NOT EXISTS tuition_requests_submitted_by_idx ON public.tuition_requests (submitted_by);
CREATE INDEX IF NOT EXISTS tuition_applications_tutor_idx ON public.tuition_applications (tutor_id);
CREATE INDEX IF NOT EXISTS legal_leads_status_idx ON public.legal_leads (status);
CREATE INDEX IF NOT EXISTS education_news_published_idx ON public.education_news (is_published, publish_date DESC);
CREATE INDEX IF NOT EXISTS business_reviews_user_idx ON public.business_reviews (user_id);
CREATE INDEX IF NOT EXISTS businesses_featured_idx ON public.businesses (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status);
CREATE INDEX IF NOT EXISTS advocates_sort_idx ON public.advocates (sort_order);

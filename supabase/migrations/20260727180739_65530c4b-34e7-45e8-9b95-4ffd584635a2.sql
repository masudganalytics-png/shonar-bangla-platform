INSERT INTO public.business_categories (name_bn, slug, group_bn, sort_order, is_active) VALUES
('প্রিন্টিং প্রেস', 'printing-press', 'খুচরা', 18, true),
('স্টেশনারি', 'stationery', 'খুচরা', 19, true),
('অফিস সাপ্লাই', 'office-supply', 'খুচরা', 25, true)
ON CONFLICT (slug) DO NOTHING;
CREATE TYPE public.rate_status AS ENUM ('increased','decreased','stable');

CREATE TABLE public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name text NOT NULL,
  country_name_bn text NOT NULL,
  flag_emoji text NOT NULL DEFAULT '',
  currency_name text NOT NULL,
  currency_code text NOT NULL UNIQUE,
  exchange_rate_to_bdt numeric(14,4) NOT NULL DEFAULT 0,
  previous_rate numeric(14,4) NOT NULL DEFAULT 0,
  rate_status public.rate_status NOT NULL DEFAULT 'stable',
  sort_order integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exchange_rates TO anon, authenticated;
GRANT ALL ON public.exchange_rates TO service_role;

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rates_public_read" ON public.exchange_rates
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.exchange_rate_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  success boolean NOT NULL,
  message text,
  provider text,
  updated_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.exchange_rate_logs TO service_role;

ALTER TABLE public.exchange_rate_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rate_logs_admin_read" ON public.exchange_rate_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.exchange_rates (country_name, country_name_bn, flag_emoji, currency_name, currency_code, exchange_rate_to_bdt, previous_rate, rate_status, sort_order) VALUES
('Saudi Arabia','সৌদি আরব','🇸🇦','Saudi Riyal','SAR',32.6000,32.6000,'stable',10),
('United Arab Emirates','সংযুক্ত আরব আমিরাত','🇦🇪','UAE Dirham','AED',33.3000,33.3000,'stable',20),
('Qatar','কাতার','🇶🇦','Qatari Riyal','QAR',33.6000,33.6000,'stable',30),
('Oman','ওমান','🇴🇲','Omani Rial','OMR',317.6000,317.6000,'stable',40),
('Kuwait','কুয়েত','🇰🇼','Kuwaiti Dinar','KWD',398.5000,398.5000,'stable',50),
('Bahrain','বাহরাইন','🇧🇭','Bahraini Dinar','BHD',324.3000,324.3000,'stable',60),
('Malaysia','মালয়েশিয়া','🇲🇾','Malaysian Ringgit','MYR',27.5000,27.5000,'stable',70),
('Singapore','সিঙ্গাপুর','🇸🇬','Singapore Dollar','SGD',91.2000,91.2000,'stable',80),
('United States','যুক্তরাষ্ট্র','🇺🇸','US Dollar','USD',122.3000,122.3000,'stable',90),
('United Kingdom','যুক্তরাজ্য','🇬🇧','Pound Sterling','GBP',155.4000,155.4000,'stable',100),
('France','ফ্রান্স','🇫🇷','Euro','EUR',133.1000,133.1000,'stable',110);
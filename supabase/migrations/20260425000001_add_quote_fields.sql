-- ===================================================================
-- TORU: 見積条件フィールド追加 & 会社プロフィール拡張
-- ===================================================================

-- quotes: 見積条件4項目 + 備考
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS delivery_date     text,
  ADD COLUMN IF NOT EXISTS delivery_location text,
  ADD COLUMN IF NOT EXISTS payment_terms     text DEFAULT '従来通り',
  ADD COLUMN IF NOT EXISTS valid_until       text DEFAULT '30日',
  ADD COLUMN IF NOT EXISTS notes             text;

-- companies: 住所・連絡先（PDF発行者情報）
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS postal_code   text,
  ADD COLUMN IF NOT EXISTS address       text,
  ADD COLUMN IF NOT EXISTS tel           text,
  ADD COLUMN IF NOT EXISTS fax           text,
  ADD COLUMN IF NOT EXISTS contact_name  text;

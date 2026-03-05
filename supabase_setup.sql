-- ==============================================================================
-- YAVAY MVP Backend Setup - Supabase SQL Script
-- ==============================================================================
-- 手順：
-- 1. [Supabaseダッシュボード] > 左メニュー [SQL Editor] > [New query] を開く
-- 2. このコードをすべてコピー＆ペーストして、画面右下の [RUN] ボタンを押す
-- ==============================================================================

-- --------------------------------------------------------
-- 1. オーナー事前登録テーブル (owners)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    car_model TEXT NOT NULL,
    car_genre TEXT NOT NULL,
    car_color TEXT NOT NULL,
    instagram_id TEXT,
    custom_features TEXT,
    car_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) の設定
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- 「匿名ユーザー（誰でも）がデータを追加できる（セキュリティポリシー）」
CREATE POLICY "Enable insert for anonymous users"
    ON public.owners FOR INSERT
    TO anon
    WITH CHECK (true);

-- --------------------------------------------------------
-- 2. BtoB問い合わせテーブル (inquiries)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    project_detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) の設定
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 「匿名ユーザー（誰でも）がデータを追加できる（セキュリティポリシー）」
CREATE POLICY "Enable insert for anonymous users"
    ON public.inquiries FOR INSERT
    TO anon
    WITH CHECK (true);

-- --------------------------------------------------------
-- 3. Storage バケット (car-images)
-- --------------------------------------------------------
-- 車両写真アップロード用のバケットを作成
INSERT INTO storage.buckets (id, name, public) 
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS (Row Level Security) の設定
-- バケットへの画像アップロードを誰にでも許可する
CREATE POLICY "Allow public upload for car images"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'car-images');

-- バケットの画像読み取りを誰にでも許可する（一覧表示などで使用）
CREATE POLICY "Allow public read for car images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'car-images');

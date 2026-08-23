-- ====================================================================
-- SwiftBill Supabase Setup & Secure Migration Script
-- ====================================================================
-- This script configures the required database schema, enables Row Level
-- Security (RLS) for all tables, sets up secure policies ensuring users
-- can only access their own data, and defines a trigger for automatic
-- user profile creation upon authentication signup.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Profiles Table Setup
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    business_name TEXT NOT NULL DEFAULT 'My Business',
    business_logo TEXT,
    address TEXT,
    gst_number TEXT,
    primary_color TEXT NOT NULL DEFAULT '#2563eb',
    accent_color TEXT NOT NULL DEFAULT '#0f172a',
    letterhead_image TEXT,
    font_family TEXT NOT NULL DEFAULT 'Inter',
    header_height INTEGER NOT NULL DEFAULT 100,
    logo_position TEXT NOT NULL DEFAULT 'left',
    font_size INTEGER NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 2. Invoices Table Setup
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    gst_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    gst_percentage NUMERIC NOT NULL DEFAULT 18,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('paid', 'unpaid')) DEFAULT 'unpaid',
    notes TEXT,
    template_type TEXT NOT NULL DEFAULT 'modern',
    font_family TEXT,
    header_height INTEGER,
    logo_position TEXT,
    font_size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_reminder_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------
-- 3. Supplemental Tables Template Setup (invoice_items, settings, user_data)
-- --------------------------------------------------------------------
-- These tables are included to satisfy security requirements and serve
-- as future expansion capabilities.
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    meta_key TEXT NOT NULL,
    meta_value TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Products catalog — powers barcode scanning + reusable line items.
-- (Standalone/re-runnable copy also lives in supabase_products_setup.sql.)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    tax_rate NUMERIC,
    unit TEXT,
    sku TEXT,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS products_user_barcode_uniq
    ON public.products (user_id, barcode)
    WHERE barcode IS NOT NULL AND barcode <> '';

CREATE INDEX IF NOT EXISTS products_user_id_idx
    ON public.products (user_id);

-- --------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS)
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 5. Row Level Security Policies
-- --------------------------------------------------------------------

-- Clean up existing policies if they already exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "System trigger creates profiles automatically" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

DROP POLICY IF EXISTS "Users can view their own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can manage their own invoice items" ON public.invoice_items;

DROP POLICY IF EXISTS "Users can view their own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.settings;

DROP POLICY IF EXISTS "Users can view their own user data" ON public.user_data;
DROP POLICY IF EXISTS "Users can manage their own user data" ON public.user_data;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "System trigger creates profiles automatically"
    ON public.profiles FOR INSERT
    WITH CHECK (TRUE); -- Note: Insert is handled by trigger but allowed for system

-- Invoices Policies
CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
    ON public.invoices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
    ON public.invoices FOR DELETE
    USING (auth.uid() = user_id);

-- Invoice Items Policies
CREATE POLICY "Users can view their own invoice items"
    ON public.invoice_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own invoice items"
    ON public.invoice_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Settings Policies
CREATE POLICY "Users can view their own settings"
    ON public.settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings"
    ON public.settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User Data Policies
CREATE POLICY "Users can view their own user data"
    ON public.user_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own user data"
    ON public.user_data FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Products Policies
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

CREATE POLICY "Users can view their own products"
    ON public.products FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
    ON public.products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
    ON public.products FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
    ON public.products FOR DELETE
    USING (auth.uid() = user_id);

-- Keep products.updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------
-- 6. Trigger for Automatic Profile Creation on User Signup
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        business_name,
        address,
        gst_number,
        primary_color,
        accent_color,
        letterhead_image,
        font_family,
        header_height,
        logo_position,
        font_size
    ) VALUES (
        new.id,
        new.email,
        'My Business',
        '',
        '',
        '#2563eb',
        '#0f172a',
        '',
        'Inter',
        100,
        'left',
        14
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger binding
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 7. Diagnostic & Helper Utilities
-- --------------------------------------------------------------------
-- Run these queries directly in the Supabase SQL Editor if you need to 
-- troubleshoot or manually confirm testing accounts.

-- A. Manually confirm email verification for a user:
-- UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = 'kenithkaras7@gmail.com';

-- B. Select all registered users to check their email confirmation status:
-- SELECT id, email, created_at, email_confirmed_at, last_sign_in_at FROM auth.users;

-- C. Check if a profile exists for a user ID:
-- SELECT * FROM public.profiles;

-- D. Force-insert a default profile if a trigger failed or was deleted:
-- INSERT INTO public.profiles (id, email, business_name, primary_color, accent_color, font_family, header_height, logo_position, font_size) 
-- VALUES ('USER_UUID_HERE', 'kenithkaras7@gmail.com', 'My Business', '#2563eb', '#0f172a', 'Inter', 100, 'left', 14) ON CONFLICT (id) DO NOTHING;

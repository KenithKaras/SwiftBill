-- ====================================================================
-- SwiftBill — Products Catalog Migration (barcode scanning support)
-- ====================================================================
-- Run this once in the Supabase SQL Editor on an existing project to add
-- the products catalog used by the barcode scanner. It is idempotent and
-- safe to re-run. New/fresh deploys get this table from supabase_setup.sql.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Products Table
-- --------------------------------------------------------------------
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

-- A user cannot have two products sharing the same (non-empty) barcode.
-- This makes scan-to-lookup deterministic. NULL/'' barcodes are allowed and
-- excluded from the constraint so services/products can be barcode-less.
CREATE UNIQUE INDEX IF NOT EXISTS products_user_barcode_uniq
    ON public.products (user_id, barcode)
    WHERE barcode IS NOT NULL AND barcode <> '';

CREATE INDEX IF NOT EXISTS products_user_id_idx
    ON public.products (user_id);

-- --------------------------------------------------------------------
-- 2. Row Level Security
-- --------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

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

-- --------------------------------------------------------------------
-- 3. Keep updated_at fresh on every UPDATE
-- --------------------------------------------------------------------
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

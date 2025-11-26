
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, AppSettings, MaterialPrices } from '../types';

let supabase: SupabaseClient | null = null;

export const initCloud = (url: string, key: string) => {
  if (url && key) {
    supabase = createClient(url, key);
  } else {
    supabase = null;
  }
  return supabase;
};

// --- Products Sync ---

export const fetchCloudProducts = async (): Promise<Product[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Cloud Fetch Error:', error);
    return null;
  }
  // Supabase stores JSON columns as objects, we map them back
  return data as Product[];
};

export const saveCloudProduct = async (product: Product): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase.from('products').upsert(product);
  if (error) console.error('Cloud Save Error:', error);
};

export const deleteCloudProduct = async (id: string): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) console.error('Cloud Delete Error:', error);
};

// --- Settings Sync (Shared Prices) ---

export const fetchCloudMaterialPrices = async (): Promise<MaterialPrices | null> => {
  if (!supabase) return null;
  // Assuming a table 'settings' with a row id='material_prices'
  const { data, error } = await supabase.from('settings').select('value').eq('id', 'material_prices').single();
  if (error || !data) return null;
  return data.value as MaterialPrices;
};

export const saveCloudMaterialPrices = async (prices: MaterialPrices): Promise<void> => {
  if (!supabase) return;
  await supabase.from('settings').upsert({ id: 'material_prices', value: prices });
};

// --- Realtime ---

export const subscribeToProducts = (callback: () => void) => {
  if (!supabase) return null;
  return supabase
    .channel('public:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
    .subscribe();
};

/*
  NOTE FOR USER:
  To use Cloud Sync, create a project on https://supabase.com
  
  Run this SQL in Supabase SQL Editor:
  
  create table products (
    id text primary key,
    code text,
    name text,
    category text,
    description text,
    image text,
    "sizeRange" text,
    "cartonSpec" text,
    "colors" text,
    costs jsonb,
    "profitMargin" numeric,
    "taxRate" numeric,
    "createdAt" bigint,
    "updatedAt" bigint,
    "aiAnalysis" text
  );

  create table settings (
    id text primary key,
    value jsonb
  );

  -- Disable RLS for simple shared access (Internal Tool)
  alter table products enable row level security;
  create policy "Public Access" on products for all using (true);
  
  alter table settings enable row level security;
  create policy "Public Access" on settings for all using (true);
*/

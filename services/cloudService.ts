
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Product, MaterialPrices } from '../types';

let supabase: SupabaseClient | null = null;
let productsChannel: RealtimeChannel | null = null;
let settingsChannel: RealtimeChannel | null = null;

// --- SQL SETUP INSTRUCTIONS ---
/*
  Copy and run this SQL in your Supabase SQL Editor to set up the tables:

  -- 1. Create Products Table (Updated with new specs)
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

  -- 2. Create Global Settings Table
  create table settings (
    id text primary key,
    value jsonb
  );

  -- 3. Enable Public Access (Row Level Security)
  alter table products enable row level security;
  create policy "Public Access Products" on products for all using (true);

  alter table settings enable row level security;
  create policy "Public Access Settings" on settings for all using (true);

  -- 4. Enable Realtime
  alter publication supabase_realtime add table products;
  alter publication supabase_realtime add table settings;
*/

export const initCloud = (url: string, key: string): boolean => {
  if (!url || !key) return false;
  try {
    supabase = createClient(url, key);
    return true;
  } catch (error) {
    console.error("Supabase Init Error", error);
    return false;
  }
};

// --- Products ---

export const fetchCloudProducts = async (): Promise<Product[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error("Supabase fetch error", error);
    return null;
  }
  return data as Product[];
};

export const saveCloudProduct = async (product: Product): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase.from('products').upsert(product);
  if (error) console.error("Supabase save error", error);
};

export const deleteCloudProduct = async (id: string): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) console.error("Supabase delete error", error);
};

// --- Settings (Material Prices) ---

export const fetchCloudMaterialPrices = async (): Promise<MaterialPrices | null> => {
    if (!supabase) return null;
    const { data } = await supabase.from('settings').select('*').eq('id', 'material_prices').single();
    return data ? data.value as MaterialPrices : null;
};

export const saveCloudMaterialPrices = async (prices: MaterialPrices): Promise<void> => {
    if (!supabase) return;
    await supabase.from('settings').upsert({ id: 'material_prices', value: prices });
};


// --- Realtime ---

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  if (!supabase) return () => {};
  
  // Clean up existing
  if (productsChannel) {
      supabase.removeChannel(productsChannel);
  }

  productsChannel = supabase
    .channel('public:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
      // Reload all on any change to keep it simple and consistent
      const prods = await fetchCloudProducts();
      if (prods) callback(prods);
    })
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            // console.log("Subscribed to products changes");
        }
    });

  return () => {
    if (productsChannel && supabase) supabase.removeChannel(productsChannel);
  };
};

export const subscribeToMaterialPrices = (callback: (prices: MaterialPrices) => void) => {
    if (!supabase) return () => {};

    if (settingsChannel) {
        supabase.removeChannel(settingsChannel);
    }

    settingsChannel = supabase
        .channel('public:settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, async (payload) => {
            if (payload.new && (payload.new as any).id === 'material_prices') {
                callback((payload.new as any).value as MaterialPrices);
            }
        })
        .subscribe();
    
    return () => {
        if (settingsChannel && supabase) supabase.removeChannel(settingsChannel);
    };
};

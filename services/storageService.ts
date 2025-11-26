
import { Product, AppSettings, MaterialPrices } from '../types';

const PRODUCTS_KEY = 'daoyee_products_v1';
const SETTINGS_KEY = 'daoyee_settings_v1';
const MATERIALS_KEY = 'daoyee_materials_v1';

// --- Products ---
export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("Failed to save products to localStorage", error);
    alert("存储空间不足，未能保存数据。建议使用云端同步功能或压缩图片。");
  }
};

export const loadProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// --- Settings ---
export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { supabaseUrl: '', supabaseKey: '', isCloudEnabled: false };
  } catch {
    return { supabaseUrl: '', supabaseKey: '', isCloudEnabled: false };
  }
};

// --- Material Prices ---
export const saveMaterialPrices = (prices: MaterialPrices): void => {
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(prices));
};

export const loadMaterialPrices = (): MaterialPrices => {
  try {
    const data = localStorage.getItem(MATERIALS_KEY);
    return data ? JSON.parse(data) : { new: 12.0, old: 8.5, eva: 15.0 }; // Default prices
  } catch {
    return { new: 12.0, old: 8.5, eva: 15.0 };
  }
};

// --- Image Utils ---
const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      try {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(rawBase64);
          resolve(compressed);
        } else {
          resolve(rawBase64);
        }
      } catch (e) {
        resolve(rawBase64);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

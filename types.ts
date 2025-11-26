
export type MaterialType = 'new' | 'old' | 'eva' | null;

export interface CostItem {
  id: string;
  name: string;
  amount: number;
  // Material Calculation Fields
  isMaterial?: boolean;
  materialType?: MaterialType;
  weight?: number; // in kg
}

export interface Product {
  id: string;
  code: string; 
  name: string;
  category: string; 
  description: string;
  image: string | null;
  // New Specification Fields
  sizeRange?: string;    // 码段 e.g. 36-41
  cartonSpec?: string;   // 箱规 e.g. 60双/箱
  colors?: string;       // 颜色 e.g. 黑/白/绿
  
  costs: CostItem[];
  profitMargin: number; 
  taxRate: number; 
  createdAt: number;
  updatedAt: number;
  aiAnalysis?: string; 
}

export interface MaterialPrices {
  new: number; // RMB per kg
  old: number;
  eva: number;
}

export interface AppSettings {
  supabaseUrl: string;
  supabaseKey: string;
  isCloudEnabled: boolean;
}

export type ViewMode = 'LIST' | 'EDIT' | 'CREATE' | 'QUOTE' | 'SHEET';

export interface AppState {
  products: Product[];
  currentView: ViewMode;
  selectedProduct: Product | null;
  searchQuery: string;
}

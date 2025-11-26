
import React, { useState, useEffect, useMemo } from 'react';
import { Product, CostItem, ViewMode, AppSettings, MaterialPrices, MaterialType } from './types';
import { saveProducts, loadProducts, fileToBase64, saveSettings, loadSettings, loadMaterialPrices, saveMaterialPrices } from './services/storageService';
import { initCloud, fetchCloudProducts, saveCloudProduct, deleteCloudProduct, subscribeToProducts, fetchCloudMaterialPrices, saveCloudMaterialPrices, subscribeToMaterialPrices } from './services/cloudService';
import { analyzeProductCosts } from './services/geminiService';
import CostChart from './components/CostChart';
import { v4 as uuidv4 } from 'uuid';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Icons ---
const SlipperIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M7 3C5.5 3 4 4.5 4 6.5V9C4 11.5 5.5 13 8 13H16C18.5 13 20 11.5 20 9V6.5C20 4.5 18.5 3 17 3H7ZM4 9.5V17C4 19.2 5.8 21 8 21H16C18.2 21 20 19.2 20 17V9.5C19 10.5 17.5 11 16 11H8C6.5 11 5 10.5 4 9.5Z" />
  </svg>
);
const PlusIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const SearchIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const BackIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
const TrashIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const EditIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
const RobotIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const SortIcon = ({ order }: { order: 'asc' | 'desc' }) => (<svg className={`w-5 h-5 transition-transform ${order === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>);
const SettingsIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const ChartIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>);
const PrinterIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>);
const CheckIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>);
const ZoomInIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>);

// --- Components ---

const QuoteSheet = ({ products, onBack }: { products: Product[]; onBack: () => void }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 quote-sheet">
      {/* Lightbox for zooming */}
      {zoomedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer print:hidden animate-fadeIn" 
            onClick={() => setZoomedImage(null)}
        >
             <div className="relative max-w-5xl max-h-screen w-full flex flex-col items-center">
                <img src={zoomedImage} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                <p className="text-white mt-4 text-sm bg-black/50 px-4 py-2 rounded-full">点击任意处关闭</p>
             </div>
        </div>
      )}

      <div className="max-w-[210mm] mx-auto bg-white min-h-screen shadow-2xl p-8 print:shadow-none print:w-full print:max-w-none">
        <div className="flex justify-between items-start mb-8 print-hidden">
          <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-900">
            <BackIcon /> <span className="ml-1">返回列表</span>
          </button>
          <div className="text-slate-500 text-sm flex items-center gap-2">
             <span className="flex items-center"><ZoomInIcon /> 点击图片可放大</span>
          </div>
          <button onClick={handlePrint} className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700">
            <PrinterIcon /> 打印/保存PDF
          </button>
        </div>

        {/* Quote Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-slate-900">DAOYEE</h1>
            <p className="text-sm text-slate-500 mt-1">专业拖鞋制造与供应链</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800">产品报价单</h2>
            <p className="text-sm text-slate-500">日期: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Quote Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 w-16">编号</th>
                <th className="border border-slate-300 p-2 w-48">图片</th>
                <th className="border border-slate-300 p-2">产品名称 & 规格</th>
                <th className="border border-slate-300 p-2 w-20">出厂价</th>
                <th className="border border-slate-300 p-2 w-20">含税价</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const cost = p.costs.reduce((sum, i) => sum + i.amount, 0);
                const exWorks = cost * (1 + p.profitMargin / 100);
                const priceWithTax = exWorks * (1 + (p.taxRate || 0) / 100);
                
                return (
                  <tr key={p.id} className="break-inside-avoid">
                    <td className="border border-slate-300 p-2 text-center font-bold">{p.code}</td>
                    <td className="border border-slate-300 p-2 text-center align-middle">
                      {p.image ? (
                          <div 
                            className="cursor-pointer hover:opacity-80 transition-opacity inline-block"
                            onClick={() => setZoomedImage(p.image)}
                            title="点击放大"
                          >
                            <img 
                                src={p.image} 
                                className="max-w-[160px] max-h-40 object-contain mx-auto" 
                                style={{ width: 'auto', height: 'auto' }}
                            />
                          </div>
                        ) : (
                          <span className="text-slate-300">无图</span>
                        )}
                    </td>
                    <td className="border border-slate-300 p-3 align-top">
                      <div className="font-bold text-sm mb-2">{p.name}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                        <div><span className="text-slate-400">类目:</span> {p.category}</div>
                        <div><span className="text-slate-400">码段:</span> {p.sizeRange || '-'}</div>
                        <div><span className="text-slate-400">颜色:</span> {p.colors || '-'}</div>
                        <div className="col-span-2"><span className="text-slate-400">箱规:</span> {p.cartonSpec || '-'}</div>
                      </div>
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono align-middle text-slate-600">
                      ¥{exWorks.toFixed(2)}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold text-lg align-middle text-slate-900">
                      ¥{priceWithTax.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
            <div>
                <p>备注：</p>
                <p>1. 以上报价有效期为15天。</p>
                <p>2. 交货期：确认订单后25-30天。</p>
            </div>
            <div className="text-right">
                <p>DAOYEE Footwear Co., Ltd.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

const ProductForm = ({ 
  initialData, 
  existingCategories,
  materialPrices,
  onSave, 
  onCancel 
}: { 
  initialData?: Product | null; 
  existingCategories: string[];
  materialPrices: MaterialPrices;
  onSave: (p: Product) => void; 
  onCancel: () => void; 
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  // New Specs
  const [sizeRange, setSizeRange] = useState(initialData?.sizeRange || '');
  const [cartonSpec, setCartonSpec] = useState(initialData?.cartonSpec || '');
  const [colors, setColors] = useState(initialData?.colors || '');

  const [profitMargin, setProfitMargin] = useState(initialData?.profitMargin || 20);
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || 0);
  const [costs, setCosts] = useState<CostItem[]>(initialData?.costs || [
    { id: generateId(), name: '鞋面材料', amount: 0, isMaterial: true, materialType: 'new', weight: 0 },
    { id: generateId(), name: '鞋底材料', amount: 0, isMaterial: true, materialType: 'eva', weight: 0 },
    { id: generateId(), name: '人工费', amount: 0, isMaterial: false },
    { id: generateId(), name: '包装费', amount: 0, isMaterial: false },
  ]);
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Recalculate material costs based on current global prices whenever weights change
  useEffect(() => {
    const updatedCosts = costs.map(cost => {
      if (cost.isMaterial && cost.materialType && cost.weight !== undefined) {
        const pricePerKg = materialPrices[cost.materialType];
        const newAmount = cost.weight * pricePerKg;
        if (Math.abs(newAmount - cost.amount) > 0.001) {
          return { ...cost, amount: newAmount };
        }
      }
      return cost;
    });
    if (JSON.stringify(updatedCosts) !== JSON.stringify(costs)) {
        setCosts(updatedCosts);
    }
  }, [costs, materialPrices]);


  const totalCost = costs.reduce((sum, item) => sum + item.amount, 0);
  const priceExTax = totalCost * (1 + profitMargin / 100);
  const priceIncTax = priceExTax * (1 + taxRate / 100);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingImage(true);
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setImage(base64);
      } catch (err) {
        alert('图片处理失败');
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const addCostItem = () => {
    setCosts([...costs, { id: generateId(), name: '', amount: 0, isMaterial: false }]);
  };

  const updateCostItem = (id: string, updates: Partial<CostItem>) => {
    setCosts(costs.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCostItem = (id: string) => {
    setCosts(costs.filter(c => c.id !== id));
  };

  const handleSave = () => {
    if (!name || !code) {
      alert('请输入产品名称和编号');
      return;
    }
    const product: Product = {
      id: initialData?.id || generateId(),
      code,
      name,
      category: category.trim() || '通用',
      description,
      image,
      sizeRange,
      cartonSpec,
      colors,
      costs,
      profitMargin,
      taxRate,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
      aiAnalysis: initialData?.aiAnalysis,
    };
    onSave(product);
  };

  return (
    <div className="glass-panel rounded-xl shadow-2xl p-6 max-w-2xl mx-auto backdrop-blur-xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-cyan-400 rounded-full"></span>
        {initialData ? '编辑产品' : '新建产品'}
      </h2>
      
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">产品编号</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg focus:outline-none font-mono-num" placeholder="Code" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">产品名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg focus:outline-none" placeholder="Name" />
          </div>
        </div>

        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">产品类目</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} list="category-suggestions" className="glass-input w-full px-3 py-2 rounded-lg focus:outline-none" placeholder="类目" />
            <datalist id="category-suggestions">
                {existingCategories.map(cat => <option key={cat} value={cat} />)}
                <option value="男式" /><option value="女式" /><option value="儿童" /><option value="凉拖" /><option value="棉拖" />
            </datalist>
        </div>

        {/* Specs */}
        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 grid grid-cols-3 gap-3">
             <div className="col-span-1">
                <label className="block text-xs text-slate-500 mb-1">码段</label>
                <input type="text" value={sizeRange} onChange={e => setSizeRange(e.target.value)} className="glass-input w-full px-2 py-1.5 rounded text-sm" placeholder="36-41" />
             </div>
             <div className="col-span-1">
                <label className="block text-xs text-slate-500 mb-1">颜色</label>
                <input type="text" value={colors} onChange={e => setColors(e.target.value)} className="glass-input w-full px-2 py-1.5 rounded text-sm" placeholder="黑/白" />
             </div>
             <div className="col-span-1">
                <label className="block text-xs text-slate-500 mb-1">箱规</label>
                <input type="text" value={cartonSpec} onChange={e => setCartonSpec(e.target.value)} className="glass-input w-full px-2 py-1.5 rounded text-sm" placeholder="60双/箱" />
             </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">产品图片</label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-slate-800/50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-700">
              {image ? <img src={image} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-slate-600 text-xs">无图</span>}
            </div>
            <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 px-4 py-2 rounded-lg text-sm transition-colors shadow-lg">
              上传图片
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <div className="h-px bg-slate-700/50 my-6"></div>

        {/* Costs */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">成本明细 (RMB)</label>
            <button onClick={addCostItem} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center font-medium">
              <PlusIcon /> 添加项目
            </button>
          </div>
          <div className="space-y-3">
            {costs.map((cost) => (
              <div key={cost.id} className="flex flex-col space-y-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div className="flex space-x-2 items-center">
                    <input type="text" value={cost.name} onChange={e => updateCostItem(cost.id, { name: e.target.value })} className="glass-input flex-1 px-3 py-2 rounded-lg text-sm" placeholder="项目名称" />
                    <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-1 cursor-pointer">
                            <input type="checkbox" checked={!!cost.isMaterial} onChange={e => updateCostItem(cost.id, { isMaterial: e.target.checked })} className="form-checkbox h-4 w-4 text-cyan-600 rounded bg-slate-700 border-slate-600" />
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">材料算式</span>
                        </label>
                        <button onClick={() => removeCostItem(cost.id)} className="text-slate-500 hover:text-red-400 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
                
                {cost.isMaterial ? (
                    <div className="flex items-center space-x-2 animate-fadeIn">
                         <div className="flex-1 flex items-center space-x-2">
                             <input type="number" step="0.01" value={cost.weight || ''} onChange={e => updateCostItem(cost.id, { weight: parseFloat(e.target.value) || 0 })} className="glass-input w-20 px-2 py-1.5 rounded text-sm text-center font-mono-num" placeholder="重量" />
                             <span className="text-xs text-slate-500">kg ×</span>
                             <select value={cost.materialType || 'new'} onChange={e => updateCostItem(cost.id, { materialType: e.target.value as MaterialType })} className="glass-input flex-1 px-2 py-1.5 rounded text-sm">
                                <option value="new">新料 (¥{materialPrices.new})</option>
                                <option value="old">旧料 (¥{materialPrices.old})</option>
                                <option value="eva">EVA (¥{materialPrices.eva})</option>
                             </select>
                         </div>
                         <div className="w-24 text-right">
                            <span className="glass-input block w-full px-2 py-1.5 rounded text-sm text-right font-mono-num bg-slate-800/50 text-slate-300">
                                {cost.amount.toFixed(2)}
                            </span>
                         </div>
                    </div>
                ) : (
                    <div className="flex justify-end">
                        <input type="number" value={cost.amount || ''} onChange={e => updateCostItem(cost.id, { amount: parseFloat(e.target.value) || 0 })} className="glass-input w-24 px-3 py-2 rounded-lg text-sm text-right font-mono-num" placeholder="0.00" />
                    </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-sm text-slate-400">
            总成本: <span className="font-mono-num text-white">¥{totalCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Pricing Calculator */}
        <div className="bg-slate-800/40 rounded-lg p-5 border border-slate-700/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs text-slate-500 mb-1">目标利润率 (%)</label>
                <input type="number" value={profitMargin} onChange={e => setProfitMargin(parseFloat(e.target.value) || 0)} className="glass-input w-full px-2 py-1.5 rounded text-center font-mono-num text-cyan-300" />
             </div>
             <div>
                <label className="block text-xs text-slate-500 mb-1">税率 (%)</label>
                <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="glass-input w-full px-2 py-1.5 rounded text-center font-mono-num text-pink-300" />
             </div>
          </div>
          
          <div className="pt-2 border-t border-slate-700/50 grid grid-cols-2 gap-4">
            <div>
                 <div className="text-xs text-slate-500">不含税出厂价</div>
                 <div className="text-lg font-mono-num text-slate-200">¥{priceExTax.toFixed(2)}</div>
            </div>
            <div className="text-right">
                 <div className="text-xs text-slate-500">含税报价</div>
                 <div className="text-2xl font-bold font-mono-num text-cyan-400">¥{priceIncTax.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button onClick={handleSave} className="flex-1 bg-cyan-600 text-white py-3 rounded-xl hover:bg-cyan-500 transition-all font-medium shadow-lg shadow-cyan-900/20">保存</button>
          <button onClick={onCancel} className="flex-1 glass-panel text-slate-300 py-3 rounded-xl hover:bg-slate-700/50 transition-colors font-medium">取消</button>
        </div>
      </div>
    </div>
  );
};

const ProductDetail = ({ 
  product, 
  onBack,
  onEdit,
  onDelete
}: { 
  product: Product; 
  onBack: () => void; 
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [analysis, setAnalysis] = useState<string>(product.aiAnalysis || '');
  const [loadingAi, setLoadingAi] = useState(false);

  const totalCost = product.costs.reduce((sum, item) => sum + item.amount, 0);
  const exWorksPrice = totalCost * (1 + product.profitMargin / 100);
  const taxRate = product.taxRate || 0;
  const priceIncTax = exWorksPrice * (1 + taxRate / 100);

  const handleAnalyze = async () => {
    setLoadingAi(true);
    const result = await analyzeProductCosts(product);
    setAnalysis(result);
    // Auto save analysis
    product.aiAnalysis = result;
    const products = loadProducts();
    const updatedProducts = products.map(p => p.id === product.id ? product : p);
    saveProducts(updatedProducts);
    setLoadingAi(false);
  };

  const getMaterialLabel = (type?: MaterialType) => {
    switch(type) {
        case 'new': return '新料';
        case 'old': return '旧料';
        case 'eva': return 'EVA';
        default: return '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-cyan-400 transition-colors">
          <BackIcon /> <span className="ml-1">返回</span>
        </button>
        <div className="flex space-x-2">
            <button onClick={onEdit} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"><EditIcon /></button>
            <button onClick={() => { if(confirm('确定删除?')) onDelete(); }} className="p-2 text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"><TrashIcon /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden aspect-square p-2 bg-slate-800/30">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded-xl text-slate-600">
                <SlipperIcon className="w-24 h-24 opacity-20" />
              </div>
            )}
          </div>
          <div className="glass-panel rounded-xl p-5">
            <h1 className="text-xl font-bold text-white mb-2">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-mono font-medium text-cyan-300 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-700/30">{product.code}</span>
                {product.category && (<span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">{product.category}</span>)}
            </div>
            
            {/* Specs Display */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-slate-800/50 p-2 rounded">
                    <span className="text-slate-500 block mb-0.5">码段</span>
                    <span className="text-slate-200">{product.sizeRange || '-'}</span>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                    <span className="text-slate-500 block mb-0.5">颜色</span>
                    <span className="text-slate-200">{product.colors || '-'}</span>
                </div>
                <div className="bg-slate-800/50 p-2 rounded col-span-2">
                    <span className="text-slate-500 block mb-0.5">箱规</span>
                    <span className="text-slate-200">{product.cartonSpec || '-'}</span>
                </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">{product.description || '暂无描述'}</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div>
                        <div className="text-cyan-100 text-sm font-medium mb-1">含税报价</div>
                        <div className="text-4xl font-bold font-mono-num tracking-tight">¥{priceIncTax.toFixed(2)}</div>
                        <div className="text-cyan-200/70 text-xs mt-1">税率 {taxRate}%</div>
                    </div>
                    <div className="text-right border-l border-white/20 pl-6">
                         <div className="text-cyan-100 text-sm font-medium mb-1">不含税出厂价</div>
                         <div className="text-2xl font-bold font-mono-num text-white/90">¥{exWorksPrice.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-xl p-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">成本构成分析</h3>
                <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-1/2">
                        <CostChart costs={product.costs} />
                    </div>
                    <div className="w-full md:w-1/2 mt-4 md:mt-0 md:pl-6 space-y-2">
                        {product.costs.map((cost) => (
                            <div key={cost.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-700/50 last:border-0">
                                <div>
                                    <span className="text-slate-400 block">{cost.name}</span>
                                    {cost.isMaterial && (
                                        <span className="text-[10px] text-slate-500">
                                            {cost.weight}kg × {getMaterialLabel(cost.materialType)}
                                        </span>
                                    )}
                                </div>
                                <span className="font-mono-num text-slate-200">¥{cost.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-xl p-6 border-l-4 border-l-cyan-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center">
                        <span className="bg-cyan-900/30 text-cyan-400 p-1.5 rounded-lg mr-2 border border-cyan-800"><RobotIcon /></span>
                        AI 智能评估
                    </h3>
                    <button onClick={handleAnalyze} disabled={loadingAi} className="text-xs bg-slate-800 text-cyan-400 border border-cyan-900 px-3 py-1.5 rounded-full hover:bg-cyan-900/30 transition-colors">
                        {loadingAi ? '...' : analysis ? '重新分析' : '生成报告'}
                    </button>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {analysis || "点击生成，获取AI成本分析建议。"}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Modals ---

const SettingsModal = ({ 
    isOpen, onClose, settings, onSaveSettings 
}: { 
    isOpen: boolean; onClose: () => void; settings: AppSettings; onSaveSettings: (s: AppSettings) => void;
}) => {
    const [url, setUrl] = useState(settings.supabaseUrl || '');
    const [key, setKey] = useState(settings.supabaseKey || '');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg p-6 rounded-2xl shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-4">系统设置 (Supabase Cloud)</h2>
                <div className="space-y-4">
                    <div className="bg-cyan-900/30 p-3 rounded-lg border border-cyan-700/50 text-xs text-cyan-200 mb-2">
                        <strong>操作指引：</strong> <br/>
                        1. 注册/登录 <a href="https://supabase.com" target="_blank" className="underline text-white">Supabase.com</a>。<br/>
                        2. 创建项目，在 Settings -> API 获取 Project URL 和 anon/public Key。<br/>
                        3. 在 Supabase SQL Editor 中运行系统提供的建表代码。
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Project URL</label>
                        <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg" placeholder="https://xyz.supabase.co" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">API Key (anon/public)</label>
                        <input type="password" value={key} onChange={e => setKey(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => {
                            if (!url || !key) {
                                alert("请输入 URL 和 Key");
                                return;
                            }
                            const success = initCloud(url, key);
                            if (success) {
                                onSaveSettings({ supabaseUrl: url, supabaseKey: key, isCloudEnabled: true });
                                onClose();
                            } else {
                                alert("连接初始化失败，请检查 URL 和 Key 格式");
                            }
                        }} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-500">保存连接</button>
                        <button onClick={onClose} className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-lg hover:bg-slate-600">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MaterialPriceModal = ({ 
    isOpen, onClose, prices, onSave 
}: { 
    isOpen: boolean; onClose: () => void; prices: MaterialPrices; onSave: (p: MaterialPrices) => void;
}) => {
    const [localPrices, setLocalPrices] = useState(prices);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-sm p-6 rounded-2xl shadow-2xl border-t-4 border-t-yellow-500">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ChartIcon /> 今日材料行情 (元/kg)
                </h2>
                <div className="space-y-4">
                    {Object.entries(localPrices).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <span className="text-sm text-slate-300 capitalize">
                                {key === 'new' ? '新料' : key === 'old' ? '旧料' : 'EVA'}
                            </span>
                            <input 
                                type="number" 
                                value={val} 
                                onChange={e => setLocalPrices({ ...localPrices, [key]: parseFloat(e.target.value) || 0 })}
                                className="bg-transparent text-right w-20 font-mono-num text-yellow-400 focus:outline-none"
                            />
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => { onSave(localPrices); onClose(); }} className="flex-1 bg-yellow-600/90 text-white py-2 rounded-lg hover:bg-yellow-500">更新行情</button>
                        <button onClick={onClose} className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-lg hover:bg-slate-600">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<ViewMode>('LIST');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [materialPrices, setMaterialPrices] = useState<MaterialPrices>(loadMaterialPrices());
  
  // Selection Mode
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [showSettings, setShowSettings] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [isCloudActive, setIsCloudActive] = useState(false);

  // Auto refresh on focus
  useEffect(() => {
    const onFocus = () => {
        if(isCloudActive) {
            // Firestore handles listeners automatically, but we can trigger a check if needed.
            // With snapshot listeners, this is usually redundant but harmless.
            console.log("App focused, realtime sync is active.");
        }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isCloudActive]);

  // Init
  useEffect(() => {
    // 1. Load Local
    setProducts(loadProducts());

    // 2. Try Cloud (Supabase)
    if (settings.isCloudEnabled && settings.supabaseUrl && settings.supabaseKey) {
      const success = initCloud(settings.supabaseUrl, settings.supabaseKey);
      if (success) {
        setIsCloudActive(true);
        
        // Subscribe to Products (Realtime)
        const unsubProducts = subscribeToProducts((cloudProducts) => {
            // Merge logic or replace? For simplicity, we replace but maybe we should warn?
            // Since it's a realtime sync tool, we assume cloud is truth.
            setProducts(cloudProducts);
            saveProducts(cloudProducts); // Cache
        });

        // Subscribe to Settings (Realtime)
        const unsubSettings = subscribeToMaterialPrices((cloudPrices) => {
             setMaterialPrices(cloudPrices);
             saveMaterialPrices(cloudPrices);
        });

        return () => { 
            unsubProducts();
            unsubSettings();
        };
      } else {
          setIsCloudActive(false);
      }
    } else {
        setIsCloudActive(false);
    }
  }, [settings]);

  const handleSaveProduct = async (product: Product) => {
    // Optimistic Update
    let updatedProducts;
    if (products.some(p => p.id === product.id)) {
      updatedProducts = products.map(p => p.id === product.id ? product : p);
    } else {
      updatedProducts = [...products, product];
    }
    setProducts(updatedProducts);
    saveProducts(updatedProducts); // Local

    if (isCloudActive) {
        await saveCloudProduct(product); // Cloud
    }

    setView('LIST');
    setSelectedProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveProducts(updated);

    if (isCloudActive) {
        await deleteCloudProduct(id);
    }

    setView('LIST');
    setSelectedProduct(null);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
      setSettings(newSettings);
      saveSettings(newSettings);
      window.location.reload(); 
  };

  const handleSavePrices = async (prices: MaterialPrices) => {
      setMaterialPrices(prices);
      saveMaterialPrices(prices);
      if(isCloudActive) {
          await saveCloudMaterialPrices(prices);
      }
  };
  
  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || '未分类'));
    return ['全部', ...Array.from(cats)];
  }, [products]);

  const existingCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let result = products.filter(p => {
      const matchesSearch = p.code.toLowerCase().includes(query) || p.name.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === '全部' || (p.category || '未分类') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    result.sort((a, b) => sortOrder === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt);
    return result;
  }, [products, searchQuery, selectedCategory, sortOrder]);
  
  // View Switcher logic
  if (view === 'SHEET') {
      const selectedProducts = products.filter(p => selectedIds.has(p.id));
      return <QuoteSheet products={selectedProducts} onBack={() => setView('LIST')} />;
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-panel border-t-0 border-x-0 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => { setView('LIST'); setSelectedProduct(null); }}>
            <div className="bg-cyan-600/20 p-2 rounded-lg text-cyan-400">
                 <SlipperIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-xl tracking-wider text-white">DAOYEE</span>
                <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-medium">
                    {isCloudActive ? '• Cloud Synced (Supabase)' : '• Local Mode'}
                </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setShowPrices(true)} className="p-2 text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-colors"><ChartIcon /></button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"><SettingsIcon /></button>
            {view === 'LIST' && (
                <button onClick={() => { setSelectedProduct(null); setView('CREATE'); }} className="ml-2 bg-cyan-600 text-white p-2 rounded-lg shadow-lg hover:bg-cyan-500">
                <PlusIcon />
                </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'LIST' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col gap-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><SearchIcon /></div>
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索产品..." className="glass-input w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none" />
                </div>
                
                <div className="flex justify-between items-center">
                    <div className="flex overflow-x-auto pb-2 no-scrollbar space-x-2 max-w-[70%]">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800/40 text-slate-400 border-slate-700'}`}>{cat}</button>
                        ))}
                    </div>
                    <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="p-2 glass-panel rounded-lg text-slate-400 hover:text-white"><SortIcon order={sortOrder} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAndSortedProducts.map(product => {
                   const cost = product.costs.reduce((sum, i) => sum + i.amount, 0);
                   const exWorks = cost * (1 + product.profitMargin / 100);
                   const taxRate = product.taxRate || 0;
                   const priceWithTax = exWorks * (1 + taxRate / 100);
                   const isSelected = selectedIds.has(product.id);
                   
                   return (
                    <div key={product.id} onClick={() => { setSelectedProduct(product); setView('QUOTE'); }} className={`glass-panel rounded-xl cursor-pointer overflow-hidden group hover:border-cyan-500/50 transition-all active:scale-95 relative ${isSelected ? 'ring-2 ring-cyan-500' : ''}`}>
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 right-2 z-10" onClick={(e) => toggleSelection(product.id, e)}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-slate-900/50 border-slate-400 text-transparent hover:border-cyan-400'}`}>
                            <CheckIcon />
                        </div>
                      </div>

                      <div className="h-40 bg-slate-900/50 relative overflow-hidden">
                        {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><SlipperIcon className="w-12 h-12 opacity-30" /></div>}
                        <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-cyan-400 border border-cyan-900/50">{product.code}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-slate-200 truncate mb-3">{product.name}</h3>
                        <div className="flex justify-between items-end">
                            <div><span className="text-[10px] text-slate-500 block">不含税</span><span className="text-sm font-mono-num text-slate-300">¥{exWorks.toFixed(1)}</span></div>
                            <div className="text-right"><span className="text-[10px] text-cyan-600 block">含税价</span><span className="text-xl font-bold font-mono-num text-cyan-400">¥{priceWithTax.toFixed(1)}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {filteredAndSortedProducts.length === 0 && <div className="text-center py-20 text-slate-500">暂无数据</div>}
          </div>
        )}

        {(view === 'CREATE' || view === 'EDIT') && (
          <ProductForm 
            initialData={selectedProduct}
            existingCategories={existingCategories}
            materialPrices={materialPrices}
            onSave={handleSaveProduct}
            onCancel={() => setView(selectedProduct ? 'QUOTE' : 'LIST')}
          />
        )}

        {view === 'QUOTE' && selectedProduct && (
          <ProductDetail 
            product={selectedProduct} 
            onBack={() => { setView('LIST'); setSelectedProduct(null); }}
            onEdit={() => setView('EDIT')}
            onDelete={() => handleDeleteProduct(selectedProduct.id)}
          />
        )}
      </main>

      {/* Floating Action Bar for Quote Generation */}
      {view === 'LIST' && selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-small">
              <button 
                onClick={() => setView('SHEET')}
                className="bg-cyan-600 text-white px-6 py-3 rounded-full shadow-2xl shadow-cyan-500/30 flex items-center space-x-2 hover:bg-cyan-500 hover:scale-105 transition-all font-bold border border-cyan-400/50"
              >
                  <PrinterIcon />
                  <span>生成报价表 ({selectedIds.size})</span>
              </button>
          </div>
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSaveSettings={handleSaveSettings} />
      <MaterialPriceModal isOpen={showPrices} onClose={() => setShowPrices(false)} prices={materialPrices} onSave={handleSavePrices} />
    </div>
  );
}

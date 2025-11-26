
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeProductCosts = async (product: Product): Promise<string> => {
  try {
    const ai = getClient();
    
    const totalCost = product.costs.reduce((sum, item) => sum + item.amount, 0);
    const exWorksPrice = totalCost * (1 + product.profitMargin / 100);
    const taxRate = product.taxRate || 0;
    const priceWithTax = exWorksPrice * (1 + taxRate / 100);

    const prompt = `
      作为一个拖鞋制造行业的资深成本会计和营销专家，请分析以下产品数据（DAOYEE品牌）：
      
      产品名称: ${product.name}
      产品编号: ${product.code}
      产品分类: ${product.category || '通用'}
      
      成本构成 (RMB):
      ${product.costs.map(c => `- ${c.name}: ¥${c.amount}`).join('\n')}
      
      财务数据:
      - 总成本: ¥${totalCost.toFixed(2)}
      - 设定利润率: ${product.profitMargin}%
      - 税率: ${taxRate}%
      - 不含税出厂价: ¥${exWorksPrice.toFixed(2)}
      - 含税报价: ¥${priceWithTax.toFixed(2)}
      
      请提供一段简短的分析（300字以内），包含以下内容：
      1. 成本结构分析：指出占比最大的成本项。
      2. 报价评估：含税价格是否具有市场竞争力。
      3. 营销建议：针对该品类（${product.category}）的一句营销文案。
      
      请用中文回答，语气专业、科技感、有建设性。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "无法生成分析结果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 分析服务暂时不可用，请检查网络或 API Key 设置。";
  }
};

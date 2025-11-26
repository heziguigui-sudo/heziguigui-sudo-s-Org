
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CostItem } from '../types';

interface CostChartProps {
  costs: CostItem[];
}

// Tech/Neon Color Palette
const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#94a3b8'];

const CostChart: React.FC<CostChartProps> = ({ costs }) => {
  const data = costs.map(c => ({
    name: c.name,
    value: c.amount
  }));

  if (data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-slate-500 text-sm">暂无成本数据</div>;
  }

  // Filter out zero values for cleaner chart
  const activeData = data.filter(d => d.value > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={activeData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={50} // Donut chart for tech look
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {activeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `¥${value.toFixed(2)}`}
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              borderRadius: '8px', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: '#e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' 
            }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', opacity: 0.8 }}
            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostChart;

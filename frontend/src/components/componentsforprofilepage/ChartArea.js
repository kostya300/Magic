// frontend/src/components/componentsforprofilepage/ChartArea.js
import '../../styles/components/profilecss/ChartArea.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const spendingData = [
  { month: 'Янв', value: 12400 },
  { month: 'Фев', value: 9800 },
  { month: 'Мар', value: 15200 },
  { month: 'Апр', value: 11600 },
  { month: 'Май', value: 18900 },
  { month: 'Июн', value: 14300 },
  { month: 'Июл', value: 21700 },
  { month: 'Авг', value: 19400 },
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="profile-chart-tooltip">
        <p className="profile-chart-tooltip-month">{label}</p>
        <p className="profile-chart-tooltip-value">₽ {payload[0].value.toLocaleString('ru')}</p>
      </div>
    );
  }
  return null;
}

function ChartArea() {
  return (
    <div className="profile-chart">
      <div className="profile-chart-header">
        <div>
          <h2 className="profile-chart-title">Расходы по месяцам</h2>
          <p className="profile-chart-subtitle">2026 год</p>
        </div>
        <div className="profile-chart-trend">
          <TrendingUp size={12} />
          <span>+24.6%</span>
        </div>
      </div>
      <div className="profile-chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={spendingData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#4f8ef7"
              strokeWidth={1.5}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 3, fill: '#4f8ef7', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChartArea;

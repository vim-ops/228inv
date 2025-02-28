import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  width?: number | string;
  height?: number | string;
  barColor?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = '100%',
  height = 300,
  barColor = '#3b82f6',
}) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill={barColor} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
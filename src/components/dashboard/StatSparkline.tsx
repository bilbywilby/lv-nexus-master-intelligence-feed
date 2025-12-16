import { AreaChart, Area, ResponsiveContainer } from 'recharts';
export function StatSparkline({ data }: { data: number[] }) {
  const chartData = data.map((value, index) => ({ name: index, value }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#colorUv)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
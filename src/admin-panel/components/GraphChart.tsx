import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const GraphChart = ({ data, type = 'line', dataKey, name, color = '#4f46e5', height = 300 }) => {
  const ChartComponent = type === 'bar' ? BarChart : type === 'area' ? AreaChart : LineChart
  const ChartElement = type === 'bar' ? Bar : type === 'area' ? Area : Line

  return (
    <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-6">
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4f46e5" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #4f46e5',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend 
            wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
          />
          <ChartElement
            type="monotone"
            dataKey={dataKey}
            name={name}
            stroke={color}
            fill={color}
            strokeWidth={2}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

export default GraphChart


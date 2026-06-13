const StatsCard = ({ title, value, icon: Icon, change, changeType, color = 'indigo' }) => {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-600/20',
      border: 'border-indigo-600/30',
      icon: 'text-indigo-400',
      value: 'text-indigo-400'
    },
    lime: {
      bg: 'bg-lime-400/20',
      border: 'border-lime-400/30',
      icon: 'text-lime-400',
      value: 'text-lime-400'
    },
    blue: {
      bg: 'bg-blue-600/20',
      border: 'border-blue-600/30',
      icon: 'text-blue-400',
      value: 'text-blue-400'
    },
    purple: {
      bg: 'bg-purple-600/20',
      border: 'border-purple-600/30',
      icon: 'text-purple-400',
      value: 'text-purple-400'
    }
  }

  const colors = colorClasses[color] || colorClasses.indigo

  return (
    <div className={`bg-[#1a1a1a] border-2 ${colors.border} rounded-2xl p-6 hover:border-lime-400/50 transition-all duration-200 shadow-lg shadow-blue-600/30 ring-1 ring-blue-500/20`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            changeType === 'positive' 
              ? 'bg-lime-400/20 text-lime-400' 
              : 'bg-red-400/20 text-red-400'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div>
        <p className={`text-3xl font-bold ${colors.value} mb-1`}>{value}</p>
        <p className="text-sm text-gray-400">{title}</p>
      </div>
    </div>
  )
}

export default StatsCard


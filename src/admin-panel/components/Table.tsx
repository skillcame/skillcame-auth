import React from 'react'

const Table = ({
  headers = [],
  data = [],
  renderRow,
  actions,
  emptyMessage = 'No data available',
  loading = false
}) => {

  // Safe validation (prevents crashes)
  const safeHeaders = Array.isArray(headers) ? headers : []
  const safeData = Array.isArray(data) ? data : []

  const colSpan = safeHeaders.length + (actions ? 1 : 0)

  return (
    <div className="bg-[#1a1a1a] border border-indigo-600/20 rounded-xl md:rounded-2xl overflow-hidden shadow-lg">

      <div className="overflow-x-auto w-full custom-scrollbar">

        <table className="w-full min-w-[600px]">

          {/* HEADER */}
          <thead className="bg-black/60 border-b border-indigo-600/20">
            <tr>
              {safeHeaders.map((header, index) => {
                const isHiddenOnMobile =
                  index > 1 &&
                  ['Phone', 'Created At', 'Last Login'].includes(header)

                return (
                  <th
                    key={`${header}-${index}`}
                    className={`px-3 md:px-4 lg:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap tracking-wide ${
                      isHiddenOnMobile ? 'hidden sm:table-cell' : ''
                    }`}
                  >
                    {header || '-'}
                  </th>
                )
              })}

              {actions && (
                <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>

            {/* LOADING STATE */}
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-indigo-600/10 animate-pulse">
                  {safeHeaders.map((_, idx) => (
                    <td key={idx} className="px-4 py-4">
                      <div className="h-3 bg-indigo-600/20 rounded w-full"></div>
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-4">
                      <div className="h-3 bg-indigo-600/20 rounded w-16 ml-auto"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : safeData.length > 0 ? (
              safeData.map((item, index) => (
                <tr
                  key={item?.id || index}
                  className="border-b border-indigo-600/10 hover:bg-black/40 transition-colors duration-200"
                >
                  {/* SAFE ROW RENDER */}
                  {typeof renderRow === 'function'
                    ? renderRow(item, index)
                    : (
                      <td
                        colSpan={colSpan}
                        className="px-4 py-4 text-red-400 text-sm"
                      >
                        Row renderer not provided
                      </td>
                    )
                  }

                  {/* ACTIONS */}
                  {actions && (
                    <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-right">
                      {typeof actions === 'function'
                        ? actions(item, index)
                        : null}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              /* EMPTY STATE */
              <tr>
                <td
                  colSpan={colSpan || 1}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-indigo-600/10 flex items-center justify-center mb-3">
                      <span className="text-indigo-400 text-xl">📊</span>
                    </div>
                    <p className="text-sm md:text-base font-medium">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>
    </div>
  )
}

export default Table

import React, { useState, useId } from 'react';
import { ChartDataPoint } from '../../types/index.ts';

interface VisitorChartProps {
  data: ChartDataPoint[];
  period: string;
  onPeriodChange: (period: string) => void;
  isLoading?: boolean;
}

export const VisitorChart: React.FC<VisitorChartProps> = ({
  data,
  period,
  onPeriodChange,
  isLoading = false
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId();

  const periods = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: '6m', label: 'Last 6 Months' },
    { key: '12m', label: 'Last 12 Months' }
  ];

  // SVG dimensions
  const width = 800;
  const height = 280;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.visitors), 10);
  const niceMax = Math.ceil(maxVal * 1.15);

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / niceMax) * chartHeight;
  };

  // Build SVG path
  const points = data.map((d, i) => `${getX(i)},${getY(d.visitors)}`).join(' ');
  const areaPoints = data.length > 0
    ? `${getX(0)},${paddingTop + chartHeight} ${points} ${getX(data.length - 1)},${paddingTop + chartHeight}`
    : '';

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  return (
    <div className="flex flex-col w-full bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">Website Visitors Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Live aggregated visitor sessions and page hits</p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-lg shrink-0 self-start sm:self-auto">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                period === p.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric summary banner */}
      <div className="flex items-center gap-6 py-2 px-3 bg-slate-950/40 rounded-lg border border-slate-800/60 mb-3 text-xs">
        <div>
          <span className="text-slate-400">Total Period Visitors:</span>{' '}
          <span className="font-semibold text-white tabular-nums">
            {data.reduce((acc, d) => acc + d.visitors, 0).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Estimated Page Views:</span>{' '}
          <span className="font-semibold text-indigo-400 tabular-nums">
            {data.reduce((acc, d) => acc + d.pageViews, 0).toLocaleString()}
          </span>
        </div>
        {activePoint && (
          <div className="ml-auto hidden sm:flex items-center gap-2 text-indigo-300 font-medium">
            <span>{activePoint.label}:</span>
            <span className="text-white tabular-nums font-bold">{activePoint.visitors} visitors</span>
            <span className="text-slate-500">·</span>
            <span className="text-indigo-400 tabular-nums">{activePoint.pageViews} views</span>
          </div>
        )}
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full aspect-[16/7] min-h-[220px]">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs">
            <span className="text-xs text-indigo-400 font-medium animate-pulse">Updating analytics chart…</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines & Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const val = Math.round(niceMax * (1 - ratio));
            const y = paddingTop + ratio * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                  opacity="0.6"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  className="tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {data.length > 1 && (
            <polygon points={areaPoints} fill={`url(#${gradientId})`} />
          )}

          {/* Connecting Line */}
          {data.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Active hover crosshair and point */}
          {hoverIndex !== null && data[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={paddingTop + chartHeight}
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].visitors)}
                r="5"
                fill="#ffffff"
                stroke="#6366f1"
                strokeWidth="3"
                className="transition-all duration-150"
              />
            </g>
          )}

          {/* Data interactive hit targets & X-axis labels */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.visitors);
            // Show label conditionally based on data count to avoid overlap
            const step = Math.max(1, Math.ceil(data.length / 8));
            const showLabel = i % step === 0 || i === data.length - 1;

            return (
              <g key={i}>
                {showLabel && (
                  <text
                    x={cx}
                    y={height - 12}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {d.label.split(',')[0]}
                  </text>
                )}

                {/* Hit target rectangle */}
                <rect
                  x={cx - (chartWidth / (data.length || 1)) / 2}
                  y={paddingTop}
                  width={chartWidth / (data.length || 1)}
                  height={chartHeight + 15}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />

                {/* Quiet dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="2.5"
                  fill="#818cf8"
                  className="pointer-events-none"
                  opacity={hoverIndex === i ? 1 : 0.6}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 bg-slate-950/95 border border-indigo-500/40 rounded-lg shadow-xl text-xs backdrop-blur-md"
            style={{
              left: `${(getX(hoverIndex) / width) * 100}%`,
              top: `${(getY(data[hoverIndex].visitors) / height) * 100}%`
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1">
              {data[hoverIndex].label}
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Visitors:</span>
              <span className="font-mono text-indigo-400 font-bold tabular-nums">
                {data[hoverIndex].visitors.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Page Views:</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {data[hoverIndex].pageViews.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

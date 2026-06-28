import React, { useState } from 'react';
import { Printer, TrendingUp, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FinancialDayData {
  day: number;
  dizimo: number;
  adoracao: number;
  missoes: number;
  total: number;
}

interface DailyFinancialChartProps {
  data: FinancialDayData[];
  monthName: string;
  year: number;
}

export const DailyFinancialChart: React.FC<DailyFinancialChartProps> = ({ data, monthName, year }) => {
  const [viewMode, setViewMode] = useState<'detalhado' | 'simplificado'>('detalhado');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Colors based on user specs (Purple for dizimo, Emerald for adoracao, Amber for missoes)
  const colors = {
    dizimo: '#8b5cf6', // Violet/Purple
    adoracao: '#10b981', // Emerald/Green
    missoes: '#f59e0b', // Amber/Orange
    total: '#4f46e5', // Indigo for simplified view
  };

  // Dynamically find number of days in the month
  const now = new Date();
  const currentYear = year || now.getFullYear();
  // Map monthName to number, or fallback to current month
  const currentMonth = now.getMonth(); 
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Populate data for all days of the month (filling missing days with 0)
  const fullMonthData: FinancialDayData[] = Array.from({ length: daysInMonth }, (_, idx) => {
    const dayNum = idx + 1;
    const found = data.find(item => item.day === dayNum);
    return found || { day: dayNum, dizimo: 0, adoracao: 0, missoes: 0, total: 0 };
  });

  // Filter days that do not have values
  const visibleData = fullMonthData.filter(d => d.total > 0);
  const chartDays = visibleData.length > 0 ? visibleData : fullMonthData;

  // Find max daily total to scale Y-axis
  const maxVal = Math.max(...chartDays.map(d => d.total), 100); // fallback min to 100
  // Round maxVal up to a nice number
  const roundMax = Math.ceil(maxVal / 100) * 100;

  // Chart dimensions
  const svgWidth = 900;
  const svgHeight = 350;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getRoundedBarPath = (x: number, y: number, w: number, h: number, r: number) => {
    if (h <= 0) return '';
    const radius = Math.min(r, h);
    return `
      M ${x},${y + h}
      V ${y + radius}
      a ${radius},${radius} 0 0 1 ${radius},-${radius}
      H ${x + w - radius}
      a ${radius},${radius} 0 0 1 ${radius},${radius}
      V ${y + h}
      Z
    `;
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const formatYLabel = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000) {
      const kVal = val / 1000;
      return kVal.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    }
    return val.toLocaleString('pt-BR');
  };

  // Helper for printing
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printDays = fullMonthData.filter(d => d.total > 0);
    const tableRows = (printDays.length > 0 ? printDays : fullMonthData)
      .map(
        d => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
        <td style="padding: 8px; text-align: center; font-weight: bold;">Dia ${d.day}</td>
        <td style="padding: 8px; text-align: right; color: ${colors.dizimo}; font-weight: 500;">${formatBRL(d.dizimo)}</td>
        <td style="padding: 8px; text-align: right; color: ${colors.adoracao}; font-weight: 500;">${formatBRL(d.adoracao)}</td>
        <td style="padding: 8px; text-align: right; color: ${colors.missoes}; font-weight: 500;">${formatBRL(d.missoes)}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: ${colors.total};">${formatBRL(d.total)}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Entradas Diárias - IEQ Paraíso - ${monthName}/${currentYear}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 800; margin: 0; color: #1e1b4b; }
          .subtitle { font-size: 14px; color: #64748b; margin: 5px 0 0 0; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          .stat-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; }
          .stat-val { font-size: 18px; font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th { background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; text-align: right; }
          th:first-child { text-align: center; }
          td { border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">IEQ Paraíso - Entradas Diárias</h1>
          <p class="subtitle">Relatório Consolidated de Dízimos e Ofertas - ${monthName} de ${currentYear}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-title" style="color: ${colors.dizimo};">Total Dízimos</div>
            <div class="stat-val" style="color: ${colors.dizimo};">${formatBRL(fullMonthData.reduce((acc, d) => acc + d.dizimo, 0))}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title" style="color: ${colors.adoracao};">Total Adoração</div>
            <div class="stat-val" style="color: ${colors.adoracao};">${formatBRL(fullMonthData.reduce((acc, d) => acc + d.adoracao, 0))}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title" style="color: ${colors.missoes};">Total Missões</div>
            <div class="stat-val" style="color: ${colors.missoes};">${formatBRL(fullMonthData.reduce((acc, d) => acc + d.missoes, 0))}</div>
          </div>
          <div class="stat-card" style="background: #e0e7ff; border-color: #c7d2fe;">
            <div class="stat-title" style="color: ${colors.total}; font-weight: 800;">Total Geral</div>
            <div class="stat-val" style="color: ${colors.total}; font-weight: 800;">${formatBRL(fullMonthData.reduce((acc, d) => acc + d.total, 0))}</div>
          </div>
        </div>

        <h3 style="border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 10px;">Lançamentos Consolidados por Dia</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Dia</th>
              <th style="width: 21%;">Dízimos</th>
              <th style="width: 21%;">Oferta Adoração</th>
              <th style="width: 21%;">Oferta Missões</th>
              <th style="width: 22%;">Total do Dia</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; page-break-inside: avoid;">
          <div style="width: 40%; text-align: center; border-top: 1px solid #1e293b; padding-top: 8px;">Pastor Titular</div>
          <div style="width: 40%; text-align: center; border-top: 1px solid #1e293b; padding-top: 8px;">Secretaria / Tesouraria</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col relative overflow-hidden">
      {/* Header of Chart */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h2 className="font-extrabold text-lg tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
            Entradas por Tipo
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Entradas diárias de dízimo e ofertas do mês de {monthName} / {currentYear}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-center">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg text-xs font-bold transition-all border shadow-sm"
          >
            <Printer size={14} />
            <span>Imprimir Gráfico</span>
          </button>

          {/* Toggle View */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border shadow-inner ml-auto sm:ml-0">
            <button
              onClick={() => setViewMode('detalhado')}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                viewMode === 'detalhado'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              detalhado
            </button>
            <button
              onClick={() => setViewMode('simplificado')}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                viewMode === 'simplificado'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              simplificado
            </button>
          </div>
        </div>
      </div>

      {/* Legends */}
      <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 py-4 border-b/40 text-xs font-semibold px-2">
        {viewMode === 'detalhado' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: colors.dizimo }}></span>
              <span className="text-muted-foreground">Dízimos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: colors.adoracao }}></span>
              <span className="text-muted-foreground">Oferta Adoração</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: colors.missoes }}></span>
              <span className="text-muted-foreground">Oferta Missões</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: colors.total }}></span>
            <span className="text-muted-foreground">Total de Entradas</span>
          </div>
        )}
      </div>

      {/* SVG Canvas Container with horizontal scroll for mobile */}
      <div className="w-full overflow-x-auto mt-6 scrollbar-thin select-none">
        <div className="min-w-[768px] relative" style={{ width: '100%', height: `${svgHeight}px` }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMinYMid meet"
            className="w-full h-full text-xs font-medium"
          >
            {/* Horizontal Gridlines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const yVal = roundMax * (i / 4);
              const yPos = paddingTop + chartHeight - (chartHeight * (i / 4));
              return (
                <g key={i} className="opacity-40">
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={svgWidth - paddingRight}
                    y2={yPos}
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    className="text-muted-foreground/35"
                  />
                  <text
                    x={paddingLeft - 12}
                    y={yPos + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px] font-bold"
                  >
                    {formatYLabel(yVal)}
                  </text>
                </g>
              );
            })}

            {/* Base line */}
            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={svgWidth - paddingRight}
              y2={paddingTop + chartHeight}
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-muted-foreground/40"
            />

            {/* Render Bars */}
            {chartDays.map((d, i) => {
              const colWidth = Math.min(50, chartWidth / chartDays.length);
              const barWidth = Math.max(10, colWidth * 0.58);
              const xPos = paddingLeft + (i * colWidth) + (colWidth - barWidth) / 2;

              // Stack calculations
              const hDizimo = (d.dizimo / roundMax) * chartHeight;
              const hAdoracao = (d.adoracao / roundMax) * chartHeight;
              const hMissoes = (d.missoes / roundMax) * chartHeight;
              const hTotal = (d.total / roundMax) * chartHeight;

              const yBase = paddingTop + chartHeight;

              const isHovered = hoveredIndex === i;

              // Stacked components list (detailed view)
              const segments = [
                { val: d.dizimo, h: hDizimo, color: colors.dizimo, label: 'Dízimo' },
                { val: d.adoracao, h: hAdoracao, color: colors.adoracao, label: 'Adoração' },
                { val: d.missoes, h: hMissoes, color: colors.missoes, label: 'Missões' }
              ];

              // Find top non-zero segment
              const activeSegments = segments.filter(seg => seg.val > 0);
              const topIndex = activeSegments.length - 1;

              return (
                <g
                  key={d.day}
                  onMouseEnter={(e) => {
                    setHoveredIndex(i);
                    // Set tooltip positioning
                    const rect = e.currentTarget.getBoundingClientRect();
                    const containerRect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                    if (rect && containerRect) {
                      setTooltipPos({
                        x: rect.left - containerRect.left + rect.width / 2,
                        y: rect.top - containerRect.top - 10
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    setTooltipPos(null);
                  }}
                  className="cursor-pointer"
                >
                  {/* Hover guideline indicator */}
                  {isHovered && (
                    <rect
                      x={xPos - colWidth * 0.2}
                      y={paddingTop}
                      width={barWidth + colWidth * 0.4}
                      height={chartHeight}
                      fill="currentColor"
                      className="text-indigo-500/5 dark:text-indigo-400/5 rounded-lg"
                      rx={4}
                    />
                  )}

                  {/* Draw bars based on view mode */}
                  {viewMode === 'simplificado' ? (
                    d.total > 0 && (
                      <path
                        d={getRoundedBarPath(xPos, yBase - hTotal, barWidth, hTotal, 5)}
                        fill={colors.total}
                        className="transition-all duration-300 hover:brightness-110 shadow-sm"
                        opacity={hoveredIndex !== null && !isHovered ? 0.4 : 1}
                      />
                    )
                  ) : (
                    // Detailed Stacked view
                    (() => {
                      let accumulatedY = yBase;
                      let drawnSegmentCount = 0;

                      return segments.map((seg, segIdx) => {
                        if (seg.val <= 0) return null;
                        
                        const h = seg.h;
                        const y = accumulatedY - h;
                        accumulatedY = y; // update for next segment

                        // Check if this is the top visible segment
                        const isTop = activeSegments.length > 0 && activeSegments[topIndex].label === seg.label;
                        
                        drawnSegmentCount++;

                        return (
                          <path
                            key={segIdx}
                            d={isTop ? getRoundedBarPath(xPos, y, barWidth, h, 4) : `M ${xPos},${y} h ${barWidth} v ${h} h -${barWidth} Z`}
                            fill={seg.color}
                            className="transition-all duration-200 hover:brightness-110 shadow-sm"
                            opacity={hoveredIndex !== null && !isHovered ? 0.45 : 1}
                          />
                        );
                      });
                    })()
                  )}

                  {/* X-Axis day labels */}
                  <text
                    x={xPos + barWidth / 2}
                    y={yBase + 20}
                    textAnchor="middle"
                    className={`text-[10px] font-bold transition-colors ${
                      isHovered
                        ? 'fill-indigo-600 dark:fill-indigo-400 font-extrabold'
                        : 'fill-muted-foreground'
                    }`}
                  >
                    {d.day}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip HTML Overlay */}
          {hoveredIndex !== null && tooltipPos && hoveredIndex < chartDays.length && (
            <div
              className="absolute z-30 bg-slate-900 text-slate-100 text-xs p-3 rounded-xl border border-slate-700 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full flex flex-col gap-1 w-44 backdrop-blur-md"
              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
            >
              <div className="font-extrabold border-b border-slate-700 pb-1.5 mb-1.5 flex justify-between text-slate-300">
                <span>Dia {chartDays[hoveredIndex].day} de {monthName}</span>
              </div>
              <div className="flex flex-col gap-1">
                {viewMode === 'detalhado' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.dizimo }}></span>
                        Dízimo:
                      </span>
                      <span className="font-extrabold text-[11px]">{formatBRL(chartDays[hoveredIndex].dizimo)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.adoracao }}></span>
                        Adoração:
                      </span>
                      <span className="font-extrabold text-[11px]">{formatBRL(chartDays[hoveredIndex].adoracao)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.missoes }}></span>
                        Missões:
                      </span>
                      <span className="font-extrabold text-[11px]">{formatBRL(chartDays[hoveredIndex].missoes)}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-1.5 mt-1 flex justify-between items-center font-extrabold text-indigo-400 text-xs">
                      <span>Total:</span>
                      <span>{formatBRL(chartDays[hoveredIndex].total)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Total Geral:</span>
                    <span className="font-extrabold text-indigo-300">{formatBRL(chartDays[hoveredIndex].total)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary Bar for context */}
      <div className="grid grid-cols-3 gap-4 border-t pt-5 mt-6 text-center text-sm font-semibold">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Média Diária</span>
          <span className="text-base font-extrabold text-foreground">
            {formatBRL(fullMonthData.reduce((acc, d) => acc + d.total, 0) / daysInMonth)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Melhor Dia</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            {(() => {
              const best = [...fullMonthData].sort((a, b) => b.total - a.total)[0];
              return best && best.total > 0 ? `Dia ${best.day} (${formatBRL(best.total)})` : 'Nenhum';
            })()}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Acumulado Mês</span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatBRL(fullMonthData.reduce((acc, d) => acc + d.total, 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyFinancialChart;

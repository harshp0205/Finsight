'use client';
import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { HistoryPoint } from '@/lib/types';

interface Props { data: HistoryPoint[]; height?: number }

export function PriceChart({ data, height = 300 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;

    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: '#0f172a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      width: ref.current.clientWidth,
      height,
    });

    const series = chart.addSeries({
      seriesType: 'Area' as const,
      lineColor: '#3b82f6',
      topColor: 'rgba(59,130,246,0.3)',
      bottomColor: 'rgba(59,130,246,0)',
      lineWidth: 2,
    } as any);

    series.setData(
      data.map(d => ({
        time: d.date.split('T')[0],
        value: d.close,
      }))
    );

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current!.clientWidth }));
    ro.observe(ref.current);

    return () => { chart.remove(); ro.disconnect(); };
  }, [data, height]);

  return <div ref={ref} className="w-full rounded-lg overflow-hidden" style={{ height }} />;
}

import type {ChartOptions, TooltipItem} from 'chart.js';

export const DASHBOARD_CHART_LAYOUT = [
  {
    id: 'weekly-payments-due',
    title: 'Thanh toán đến hạn trong tuần',
    group: 'primary',
  },
  {
    id: 'records-summary',
    title: 'Tổng hợp hồ sơ',
    group: 'secondary',
  },
  {
    id: 'monthly-revenue',
    title: 'Doanh thu hằng tháng',
    group: 'secondary',
  },
] as const;

export type DashboardChartId = (typeof DASHBOARD_CHART_LAYOUT)[number]['id'];

export type DashboardSecondaryChartLayout = {
  id: Extract<DashboardChartId, 'monthly-revenue' | 'records-summary'>;
  columns: number | 'full';
};

export type DashboardChartColors = {
  grid: string;
  text: string;
  tooltipBg: string;
  tooltipText: string;
};

export function formatCompactNumber(value: number): string {
  return Math.round(value).toLocaleString('vi-VN');
}

export function getSecondaryChartLayout(
  isStacked: boolean,
): readonly DashboardSecondaryChartLayout[] {
  return [
    {
      id: 'monthly-revenue',
      columns: isStacked ? 'full' : 7,
    },
    {
      id: 'records-summary',
      columns: isStacked ? 'full' : 3,
    },
  ];
}

export function createEntityPieOptions(
  chartColors: DashboardChartColors,
): ChartOptions<'pie'> {
  return {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.7,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: chartColors.text,
        },
      },
      tooltip: {
        backgroundColor: chartColors.tooltipBg,
        titleColor: chartColors.tooltipText,
        bodyColor: chartColors.tooltipText,
        borderColor: chartColors.grid,
        borderWidth: 1,
        callbacks: {
          label: (context: TooltipItem<'pie'>) =>
            `${context.label}: ${formatCompactNumber(
              Number(context.parsed ?? 0),
            )}`,
        },
      },
    },
  };
}

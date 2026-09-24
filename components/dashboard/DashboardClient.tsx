'use client';

import {useMemo, type ReactNode} from 'react';
import {Badge} from '@astryxdesign/core/Badge';
import {Banner} from '@astryxdesign/core/Banner';
import {Card} from '@astryxdesign/core/Card';
import {Grid, GridSpan} from '@astryxdesign/core/Grid';
import {LandPlot, ReceiptText, HandCoins} from 'lucide-react'
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutHeader,
  VStack,
} from '@astryxdesign/core/Layout';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Heading, Text} from '@astryxdesign/core/Text';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {useTheme} from '@astryxdesign/core/theme';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';
import {Bar, Line, Pie} from 'react-chartjs-2';

import {useAllContracts} from '@/hooks/useAllRecords';
import {useAllCustomers} from '@/hooks/useAllRecords';
import {useAllLands} from '@/hooks/useAllRecords';
import {formatMoney} from '@/utils/format';
import {buildDashboardData} from './dashboardData';
import {
  DASHBOARD_CHART_LAYOUT,
  createEntityPieOptions,
  formatCompactNumber,
  getSecondaryChartLayout,
  type DashboardChartId,
} from './dashboardPresentation';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);


function errorMessageOf(error: unknown): string | null {
  if (error == null) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể tải dữ liệu tổng quan.';
}

export function DashboardClient() {
  const {token} = useTheme();
  const isSecondaryChartsStacked = useMediaQuery('(max-width: 768px)');
  const {
    data: contractsResponse,
    error: contractsError,
    isPending: isContractsPending,
    isFetching: isContractsFetching,
  } = useAllContracts();
  const {
    data: landsResponse,
    error: landsError,
    isPending: isLandsPending,
    isFetching: isLandsFetching,
  } = useAllLands();
  const {
    data: customersResponse,
    error: customersError,
    isPending: isCustomersPending,
    isFetching: isCustomersFetching,
  } = useAllCustomers();

  const contracts = useMemo(
    () => contractsResponse?.data ?? [],
    [contractsResponse?.data],
  );
  const lands = useMemo(() => landsResponse?.data ?? [], [landsResponse?.data]);
  const customers = useMemo(
    () => customersResponse?.data ?? [],
    [customersResponse?.data],
  );
  const dashboardData = useMemo(
    () => buildDashboardData({contracts, customers, lands}),
    [contracts, customers, lands],
  );
  const isLoading =
    isContractsPending || isLandsPending || isCustomersPending;
  const isRefreshing =
    isContractsFetching || isLandsFetching || isCustomersFetching;
  const errorMessage =
    errorMessageOf(contractsError) ??
    errorMessageOf(landsError) ??
    errorMessageOf(customersError);

  const chartColors = useMemo(
    () => ({
      blue: token('--color-text-accent'),
      blueFill: token('--color-accent'),
      green: token('--color-border-green'),
      greenFill: token('--color-background-green'),
      orange: token('--color-border-orange'),
      orangeFill: token('--color-background-orange'),
      teal: token('--color-border-teal'),
      tealFill: token('--color-background-teal'),
      grid: token('--color-border'),
      text: token('--color-text-secondary'),
      tooltipBg: token('--color-background-popover'),
      tooltipText: token('--color-text-primary'),
    }),
    [token],
  );

  const weeklyChartOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.6,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: chartColors.tooltipBg,
          titleColor: chartColors.tooltipText,
          bodyColor: chartColors.tooltipText,
          borderColor: chartColors.grid,
          borderWidth: 1,
          callbacks: {
            label: (context: TooltipItem<'bar'>) =>
              `Tiền thuê: ${formatMoney(Number(context.parsed.y ?? 0))}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: chartColors.text,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: chartColors.grid,
          },
          ticks: {
            color: chartColors.text,
            callback: value => formatMoney(Number(value)),
          },
        },
      },
    }),
    [chartColors],
  );

  const monthlyChartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 3,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: chartColors.tooltipBg,
          titleColor: chartColors.tooltipText,
          bodyColor: chartColors.tooltipText,
          borderColor: chartColors.grid,
          borderWidth: 1,
          callbacks: {
            label: (context: TooltipItem<'line'>) =>
              `Tiền thuê: ${formatMoney(Number(context.parsed.y ?? 0))}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: chartColors.text,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: chartColors.grid,
          },
          ticks: {
            color: chartColors.text,
            callback: value => formatMoney(Number(value)),
          },
        },
      },
    }),
    [chartColors],
  );

  const weeklyChartData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: dashboardData.weeklyRevenue.map(point => point.label),
      datasets: [
        {
          label: 'Tiền thuê đến hạn trong tuần',
          data: dashboardData.weeklyRevenue.map(point => point.amount),
          backgroundColor: chartColors.blueFill,
          borderColor: chartColors.blue,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }),
    [chartColors, dashboardData.weeklyRevenue],
  );

  const monthlyChartData = useMemo<ChartData<'line'>>(
    () => ({
      labels: dashboardData.monthlyRevenue.map(point => point.label),
      datasets: [
        {
          label: 'Doanh thu hằng tháng',
          data: dashboardData.monthlyRevenue.map(point => point.amount),
          borderColor: chartColors.green,
          backgroundColor: chartColors.greenFill,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [chartColors, dashboardData.monthlyRevenue],
  );

  const entityChartData = useMemo<ChartData<'pie'>>(
    () => ({
      labels: dashboardData.entityCounts.map(item => item.label),
      datasets: [
        {
          label: 'Tổng số hồ sơ',
          data: dashboardData.entityCounts.map(item => item.value),
          backgroundColor: [
            chartColors.tealFill,
            chartColors.orangeFill,
            chartColors.blueFill,
          ],
          borderColor: [
            chartColors.teal,
            chartColors.orange,
            chartColors.blue,
          ],
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }),
    [chartColors, dashboardData.entityCounts],
  );

  const entityChartOptions = useMemo<ChartOptions<'pie'>>(
    () => createEntityPieOptions(chartColors),
    [chartColors],
  );

  const chartCards: Record<DashboardChartId, ReactNode> = {
    'weekly-payments-due': (
      <Card key="weekly-payments-due" padding={4}>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={2}>Thanh toán đến hạn trong tuần</Heading>
            <Text color="secondary">Hạn thanh toán trong tuần hiện tại.</Text>
          </VStack>
          <Bar data={weeklyChartData} options={weeklyChartOptions} />
        </VStack>
      </Card>
    ),
    'records-summary': (
      <Card key="records-summary" padding={4}>
        <VStack gap={4} className="flex">
          <VStack gap={1}>
            <Heading level={2}>Tổng hợp hồ sơ</Heading>
            <Text color="secondary">Khu đất, hợp đồng và khách hàng.</Text>
          </VStack>
          <Pie data={entityChartData} options={entityChartOptions} />
        </VStack>
      </Card>
    ),
    'monthly-revenue': (
      <Card key="monthly-revenue" padding={4}>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={2}>Doanh thu hằng tháng</Heading>
            <Text color="secondary">
              Tiền thuê dự kiến theo tháng đến hạn trong năm hiện tại.
            </Text>
          </VStack>
          <Line data={monthlyChartData} options={monthlyChartOptions} />
        </VStack>
      </Card>
    ),
  };
  const primaryChartCards = DASHBOARD_CHART_LAYOUT.filter(
    chart => chart.group === 'primary',
  ).map(chart => chartCards[chart.id]);
  const secondaryChartLayout = getSecondaryChartLayout(
    isSecondaryChartsStacked,
  );

  return (
    <Layout
      height="fill"
      padding={isSecondaryChartsStacked ? 3 : 6}
      contentWidth="fill"
      header={
        <LayoutHeader label="Tiêu đề tổng quan">
          <VStack gap={1}>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Heading level={1}>Tổng quan</Heading>
              {isRefreshing && <Badge variant="neutral" label="Đang làm mới" />}
            </HStack>
            <Text color="secondary">
              Khu đất, hợp đồng đang hiệu lực, thanh toán đến hạn và doanh thu dự kiến.
            </Text>
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent label="Biểu đồ tổng quan" padding={isSecondaryChartsStacked ? 3 : 6}>
          <VStack gap={5}>
            {isLoading && (
              <ProgressBar
                label="Đang tải tổng quan"
                isLabelHidden
                isIndeterminate
              />
            )}

            {errorMessage != null && (
              <Banner
                status="error"
                title="Không thể tải tổng quan"
                description={errorMessage}
                container="section"
              />
            )}

              <Grid
                gap={4}
                columns={isSecondaryChartsStacked ? 1 : 3}
                width="100%"
              >
                <Card padding={5}>
                  <VStack gap={2}>
                    <Text color="secondary">Khu đất</Text>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                    <Heading level={2}>
                      {formatCompactNumber(dashboardData.metrics.landCount)} 
                    </Heading>
                    <LandPlot size={20} />
                    </HStack>
                    <Text type="supporting" color="secondary">
                      Khu đất đã đăng ký
                    </Text>
                  </VStack>
                </Card>
                <Card padding={5}>
                  <VStack gap={2}>
                    <Text color="secondary">Hợp đồng</Text>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                    <Heading level={2}>
                      {formatCompactNumber(
                        dashboardData.metrics.contractCount,
                      )}
                    </Heading>
                    <ReceiptText size={20} />
                    </HStack>
                    <Text type="supporting" color="secondary">
                      Hợp đồng cho thuê
                    </Text>
                  </VStack>
                </Card>
                <Card padding={5}>
                  <VStack gap={2}>
                    <Text color="secondary">Doanh thu</Text>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <Heading level={2}>
                        {formatMoney(dashboardData.metrics.totalRevenue)}
                      </Heading>
                      <HandCoins size={20} />
                    </HStack>
                    <Text type="supporting" color="secondary">
                      Tổng tiền thuê dự kiến
                    </Text>
                  </VStack>
                </Card>
              </Grid>

              <VStack gap={4}>{primaryChartCards}</VStack>

              <Grid
                gap={4}
                columns={isSecondaryChartsStacked ? 1 : 10}
                width="100%"
              >
                {secondaryChartLayout.map(chart => (
                  <GridSpan key={chart.id} columns={chart.columns}>
                    {chartCards[chart.id]}
                  </GridSpan>
                ))}
              </Grid>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

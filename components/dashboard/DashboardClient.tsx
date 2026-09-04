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
import {Section} from '@astryxdesign/core/Section';
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

import {useContracts} from '@/hooks/useContract';
import {useCustomers} from '@/hooks/useCustomers';
import {useLands} from '@/hooks/useLands';
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

const DATA_PAGE = {page: 1, pageSize: 100};

function errorMessageOf(error: unknown): string | null {
  if (error == null) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Could not load dashboard data.';
}

export function DashboardClient() {
  const {token} = useTheme();
  const isSecondaryChartsStacked = useMediaQuery('(max-width: 768px)');
  const {
    data: contractsResponse,
    error: contractsError,
    isPending: isContractsPending,
    isFetching: isContractsFetching,
  } = useContracts(DATA_PAGE);
  const {
    data: landsResponse,
    error: landsError,
    isPending: isLandsPending,
    isFetching: isLandsFetching,
  } = useLands(DATA_PAGE);
  const {
    data: customersResponse,
    error: customersError,
    isPending: isCustomersPending,
    isFetching: isCustomersFetching,
  } = useCustomers(DATA_PAGE);

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
      blue: token('--color-border-blue'),
      blueFill: token('--color-background-blue'),
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
              `Rent amount: ${formatMoney(Number(context.parsed.y ?? 0))}`,
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
              `Rent amount: ${formatMoney(Number(context.parsed.y ?? 0))}`,
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
          label: 'Weekly rent due',
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
          label: 'Monthly revenue',
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
          label: 'Total records',
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
            <Heading level={2}>Weekly payments due</Heading>
            <Text color="secondary">Current week by payment due date.</Text>
          </VStack>
          <Bar data={weeklyChartData} options={weeklyChartOptions} />
        </VStack>
      </Card>
    ),
    'records-summary': (
      <Card key="records-summary" padding={4}>
        <VStack gap={4} className="flex">
          <VStack gap={1}>
            <Heading level={2}>Records summary</Heading>
            <Text color="secondary">Lands, contracts, and customers.</Text>
          </VStack>
          <Pie data={entityChartData} options={entityChartOptions} />
        </VStack>
      </Card>
    ),
    'monthly-revenue': (
      <Card key="monthly-revenue" padding={4}>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={2}>Monthly revenue</Heading>
            <Text color="secondary">
              Expected rent by due month for the current year.
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
      padding={6}
      contentWidth="fill"
      header={
        <LayoutHeader label="Dashboard header">
          <VStack gap={1}>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Heading level={1}>Dashboard</Heading>
              {isRefreshing && <Badge variant="neutral" label="Refreshing" />}
            </HStack>
            <Text color="secondary">
              Land records, active leases, due payments, and expected revenue.
            </Text>
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent label="Dashboard charts">
          <VStack gap={2}>
            {isLoading && (
              <ProgressBar
                label="Loading dashboard"
                isLabelHidden
                isIndeterminate
              />
            )}

            {errorMessage != null && (
              <Banner
                status="error"
                title="Could not load dashboard"
                description={errorMessage}
                container="section"
              />
            )}

            <Section variant="transparent" padding={4}>
              <Grid
                gap={4}
                columns={{minWidth: 240, max: 3, repeat: 'fit'}}
                width="100%"
              >
                <Card padding={4} minHeight={116}>
                  <VStack gap={2}>
                    <Text color="secondary">Lands</Text>
                    <div className="flex items-center gap-2">
                    <Heading level={2}>
                      {formatCompactNumber(dashboardData.metrics.landCount)} 
                    </Heading>
                    <LandPlot size={20} />
                    </div>
                    <Text type="supporting" color="secondary">
                      Registered parcels
                    </Text>
                  </VStack>
                </Card>
                <Card padding={4} minHeight={116}>
                  <VStack gap={2}>
                    <Text color="secondary">Contracts</Text>
                    <div className="flex items-center gap-2">
                    <Heading level={2}>
                      {formatCompactNumber(
                        dashboardData.metrics.contractCount,
                      )}
                    </Heading>
                    <ReceiptText size={20} />
                    </div>
                    <Text type="supporting" color="secondary">
                      Lease agreements
                    </Text>
                  </VStack>
                </Card>
                <Card padding={4} minHeight={116}>
                  <VStack gap={2}>
                    <Text color="secondary">Revenue</Text>
                    <div className="flex items-center gap-2">
                      <Heading level={2}>
                        {formatMoney(dashboardData.metrics.totalRevenue)}
                      </Heading>
                      <HandCoins size={20} />
                    </div>
                    <Text type="supporting" color="secondary">
                      Expected rent total
                    </Text>
                  </VStack>
                </Card>
              </Grid>
            </Section>

            <Section variant="transparent" padding={4}>
              <VStack gap={4}>{primaryChartCards}</VStack>
            </Section>

            <Section variant="transparent" padding={4}>
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
            </Section>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

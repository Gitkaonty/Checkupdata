import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line } from 'react-chartjs-2';
import { Stack } from '@mui/material';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

const formatValue = (value) => {
    if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
    if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(0) + 'k';
    return value;
};

const LineChartComponent = ({ xAxis, dataN, dataN1, label }) => {
    const dataNOnAllLabels = xAxis.map((lbl, idx) => dataN[idx] ?? null);
    const dataN1OnAllLabels = xAxis.map((lbl, idx) => dataN1?.[idx] ?? null);

    const shadowPlugin = {
        id: 'shadowPlugin',
        beforeDatasetDraw(chart, args) {
            const { ctx } = chart;
            const datasetIndex = args.index;
            const dataset = chart.data.datasets[datasetIndex];

            if (!dataset) return;

            const color = dataset.borderColor || 'rgba(0,0,0,0.5)';

            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 10;
        },
        afterDatasetDraw(chart, args) {
            chart.ctx.restore();
        }
    };

    const chartData = {
        labels: xAxis,
        datasets: [
            {
                label: `N`,
                data: dataNOnAllLabels,
                borderColor: '#349beb',
                backgroundColor: '#349beb',
                borderWidth: 2,
                pointRadius: 10,
                tension: 0.4,
                pointHoverRadius: 10,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                datalabels: {
                    display: false,
                },
            },
            ...(dataN1 ? [{
                label: `N-1`,
                data: dataN1OnAllLabels,
                borderColor: '#de5f23',
                backgroundColor: '#de5f23',
                borderWidth: 2,
                pointRadius: 10,
                pointHoverRadius: 10,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                tension: 0.4,
                datalabels: {
                    display: false,
                },
            }] : [])
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 0 },
        plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: label, font: { size: 18 } },
            tooltip: { enabled: true },
            datalabels: {},
        },
        scales: {
            y: {
                ticks: { callback: formatValue, display: true, padding: 0 },
                grid: { display: true },
            },
            x: {
                ticks: { padding: 0 },
                grid: { display: true },
            },
        },
    };

    return (
        <Stack flex={1} height={'100%'}
            alignItems="center"
            direction="column"
        >
            <Line data={chartData} options={options} plugins={[shadowPlugin]} />
        </Stack>
    );
};

export default LineChartComponent;
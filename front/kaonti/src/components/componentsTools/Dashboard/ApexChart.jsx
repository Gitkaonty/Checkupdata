import Chart from "react-apexcharts";
import { Stack } from "@mui/material";

const formatValue = (value) => {
    if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
    if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
    if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(0) + "k";
    return value;
};

const ApexChart = ({ xAxis, dataN, dataN1, label, type }) => {
    const dataNOnAllLabels = xAxis.map((_, idx) => dataN[idx] ?? null);
    const dataN1OnAllLabels = xAxis.map((_, idx) => dataN1?.[idx] ?? null);

    const series = [
        {
            name: "N",
            data: dataNOnAllLabels,
        },
        ...(dataN1
            ? [
                {
                    name: "N-1",
                    data: dataN1OnAllLabels,
                },
            ]
            : []),
    ];

    const options = {
        chart: {
            type: "line",
            toolbar: { show: true },
            dropShadow: {
                enabled: true,
                top: 10,
                left: 0,
                blur: 10,
                opacity: 0.3,
            },
        },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        colors: ["#349beb", "#de5f23"],
        title: {
            text: label,
            align: "center",
            style: {
                fontSize: "18px",
            },
        },
        xaxis: {
            categories: xAxis,
        },
        yaxis: {
            labels: {
                formatter: (val) => formatValue(val),
            },
        },
        tooltip: {
            y: {
                formatter: (val) => val.toLocaleString()
            }
        },
        markers: {
            size: 0,
            hover: {
                size: 6,
            },
        },
        legend: {
            position: "top",
        },
        grid: {
            show: true,
        },
        dataLabels: {
            enabled: false
        },
    };

    return (
        <Stack flex={1} height="100%" width="100%">
            <Chart
                options={options}
                series={series}
                type={type}
                height="100%"
                width="100%"
            />
        </Stack>
    );
};

export default ApexChart;
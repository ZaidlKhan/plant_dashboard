import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import './styles.css';
import { getSensorData } from './services/mongodb';

const getFilteredData = (data, range) => {
    if (!data.length) return { labels: [], values: [] };
    if (range === 'day') {
        const filtered = data.slice(-24);
        return {
            labels: filtered.map(d => new Date(d.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            values: filtered.map(d => d.value)
        };
    } else if (range === 'week') {
        const byDay = {};
        data.forEach(d => {
            const date = new Date(d.dateTime);
            const dayKey = date.toLocaleDateString();
            if (!byDay[dayKey]) byDay[dayKey] = [];
            byDay[dayKey].push(d);
        });
        const allDays = Object.keys(byDay).sort((a, b) => new Date(a) - new Date(b));
        const last7 = allDays.slice(-7);
        const points = last7.map(day => {
            const noon = new Date(day + ' 12:00');
            let closest = byDay[day][0];
            let minDiff = Math.abs(new Date(closest.dateTime) - noon);
            byDay[day].forEach(d => {
                const diff = Math.abs(new Date(d.dateTime) - noon);
                if (diff < minDiff) {
                    closest = d;
                    minDiff = diff;
                }
            });
            return closest;
        });
        return {
            labels: points.map(d => new Date(d.dateTime).toLocaleDateString()),
            values: points.map(d => d.value)
        };
    }
    return { labels: [], values: [] };
};

const Graph = ({ id, label, data, color, theme, fixedRange }) => {
    const [range, setRange] = useState(fixedRange || 'week');
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const effectiveRange = fixedRange || range;
    const { labels, values } = getFilteredData(data, effectiveRange);

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        const isLight = theme === 'light';
        const fontColor = isLight ? '#222' : 'white';
        const gridColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

        if (chartRef.current) chartRef.current.destroy();
        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    borderColor: color,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 10
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                        },
                        ticks: {
                            color: fontColor,
                        }
                    },
                    x: {
                        grid: {
                            color: gridColor,
                        },
                        ticks: {
                            color: fontColor,
                            maxRotation: 60,
                            minRotation: 60,
                            autoSkip: true,
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: fontColor,
                        }
                    }
                }
            },
        });

        return () => {
            chartRef.current?.destroy();
        };
    }, [labels, values, label, color, theme]);

    return (
        <div className={`graph-container${fixedRange ? ' no-range-selector' : ''}`}>
            {!fixedRange && (
                <div className="graph-range-selector">
                    <button className={range === 'day' ? 'active' : ''} onClick={() => setRange('day')}>Day</button>
                    <button className={range === 'week' ? 'active' : ''} onClick={() => setRange('week')}>Week</button>
                </div>
            )}
            <canvas ref={canvasRef} id={id}></canvas>
        </div>
    );
};

const now = new Date();
const makeData = (n, min, max, stepHours = 1) =>
    Array.from({ length: n }, (_, i) => ({
        dateTime: new Date(now.getTime() - (n - i - 1) * stepHours * 60 * 60 * 1000).toISOString(),
        value: Math.floor(Math.random() * (max - min + 1)) + min
    }));

const Dashboard = () => {
    const [theme, setTheme] = useState('dark');
    const [moistureData, setMoistureData] = useState([]);
    const [temperatureData, setTemperatureData] = useState([]);
    const [humidityData, setHumidityData] = useState([]);

    useEffect(() => {
        document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
    }, [theme]);

    useEffect(() => {
        // Get initial data
        setMoistureData(getSensorData('moisture'));
        setTemperatureData(getSensorData('temperature'));
        setHumidityData(getSensorData('humidity'));

        // Update data every 3 hours
        const interval = setInterval(() => {
            setMoistureData(getSensorData('moisture'));
            setTemperatureData(getSensorData('temperature'));
            setHumidityData(getSensorData('humidity'));
        }, 3 * 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="dashboard">
            <div className="title-section">
                <div className="header">
                    Zaid's Plant
                    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light/dark mode">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
                <div className="status">Overall Health: GREAT</div>
            </div>
            <div className="plant-image-section">
                <img
                    src="https://via.placeholder.com/300x300"
                    alt="Plant"
                    className="plant-image"
                />
            </div>
            <div className="content-section">
                <div className="graphs-grid">
                    <Graph
                        id="moisture"
                        label="Moisture (%)"
                        data={moistureData}
                        color="#00ffff"
                        theme={theme}
                    />
                    <Graph
                        id="temperature"
                        label="Temperature (°C)"
                        data={temperatureData}
                        color="#ff6b6b"
                        theme={theme}
                    />
                    <Graph
                        id="humidity"
                        label="Humidity (%)"
                        data={humidityData}
                        color="#2196f3"
                        theme={theme}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
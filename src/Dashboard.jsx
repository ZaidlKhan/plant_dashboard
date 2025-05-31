import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { getTemperatureData, getHumidityData, getMoistureData } from './services/api';
import './styles.css';

const getFilteredData = (data, range) => {
    if (!data.length) return { labels: [], values: [] };

    // Sort data by timestamp to ensure correct order
    const sortedData = [...data].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    if (range === 'day') {
        // For day view, show all data points
        return {
            labels: sortedData.map(d => new Date(d.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            values: sortedData.map(d => d.value)
        };
    } else if (range === 'week') {
        // For week view, group by day and take the average
        const byDay = {};
        sortedData.forEach(d => {
            const date = new Date(d.dateTime);
            const dayKey = date.toLocaleDateString();
            if (!byDay[dayKey]) byDay[dayKey] = [];
            byDay[dayKey].push(d);
        });

        const allDays = Object.keys(byDay).sort((a, b) => new Date(a) - new Date(b));
        const last7 = allDays.slice(-7);

        const points = last7.map(day => {
            const dayData = byDay[day];
            // Calculate average for the day
            const avgValue = dayData.reduce((sum, d) => sum + d.value, 0) / dayData.length;
            return {
                dateTime: dayData[0].dateTime, // Use first timestamp of the day
                value: avgValue
            };
        });

        return {
            labels: points.map(d => new Date(d.dateTime).toLocaleDateString()),
            values: points.map(d => d.value)
        };
    }
    return { labels: [], values: [] };
};

const Graph = ({ id, label, data, color, theme, fixedRange, min, max }) => {
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
                        min: min,
                        max: max,
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
    }, [labels, values, label, color, theme, min, max]);

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
    }, [theme]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                const [tempData, humidData, moistData] = await Promise.all([
                    getTemperatureData(),
                    getHumidityData(),
                    getMoistureData()
                ]);

                setTemperatureData(tempData);
                setHumidityData(humidData);
                setMoistureData(moistData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to fetch data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    if (isLoading) {
        return (
            <div className="dashboard">
                <div className="title-section">
                    <div className="header">
                        Zaid's Plant
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light/dark mode">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>
                    <div className="status">Loading data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard">
                <div className="title-section">
                    <div className="header">
                        Zaid's Plant
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light/dark mode">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>
                    <div className="status" style={{ color: '#ff4444' }}>{error}</div>
                </div>
            </div>
        );
    }

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
                    src="https://raw.githubusercontent.com/ZaidlKhan/plant_dashboard/refs/heads/master/camera_pics/test.jpg"
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
                        min={0}
                        max={100}
                    />
                    <Graph
                        id="temperature"
                        label="Temperature (°C)"
                        data={temperatureData}
                        color="#ff6b6b"
                        theme={theme}
                        min={0}
                        max={30}
                    />
                    <Graph
                        id="humidity"
                        label="Humidity (%)"
                        data={humidityData}
                        color="#2196f3"
                        theme={theme}
                        min={0}
                        max={100}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
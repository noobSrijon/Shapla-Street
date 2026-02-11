import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';

const TradingViewChart = ({ data, chartType, timeRange, predictionData, height = 500 }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const predictionSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const [error, setError] = useState(null);
    const [legendData, setLegendData] = useState(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!chartContainerRef.current) {
            console.log('Chart container not ready');
            return;
        }

        if (!data || data.length === 0) {
            console.log('No data provided to chart');
            return;
        }

        // Final safety check for sorting and duplicates
        const validateData = (d, name) => {
            if (!d || d.length < 2) return d;
            for (let i = 1; i < d.length; i++) {
                if (d[i].time <= d[i - 1].time) {
                    console.error(`Data sorting error in ${name} at index ${i}: time=${d[i].time}, prev=${d[i - 1].time}`);
                    // Deduplicate and re-sort if necessary
                    const seen = new Set();
                    return d.filter(item => {
                        if (seen.has(item.time)) return false;
                        seen.add(item.time);
                        return true;
                    }).sort((a, b) => a.time - b.time);
                }
            }
            return d;
        };

        const validatedData = validateData(data, 'main data');
        const validatedPrediction = validateData(predictionData, 'prediction data');

        console.log('Creating chart with data:', validatedData.length, 'points, type:', chartType);

        try {
            setError(null);

            // Create chart instance with theme-aware colors and advanced features
            const isDark = theme === 'dark';
            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { color: isDark ? '#131722' : '#FFFFFF' },
                    textColor: isDark ? '#D1D5DB' : '#4B5563',
                    fontSize: 12,
                },
                grid: {
                    vertLines: {
                        color: isDark ? '#1F2937' : '#F3F4F6',
                        style: 0, // Solid lines
                        visible: true,
                    },
                    horzLines: {
                        color: isDark ? '#1F2937' : '#F3F4F6',
                        style: 0, // Solid lines
                        visible: true,
                    },
                },
                width: chartContainerRef.current.clientWidth,
                height: height,
                timeScale: {
                    timeVisible: false, // DSE doesn't have intraday data, only daily data
                    secondsVisible: false,
                    borderColor: isDark ? '#2A2E39' : '#E5E7EB',
                    fixLeftEdge: false,
                    fixRightEdge: false,
                    borderVisible: true,
                    rightOffset: 12,
                    barSpacing: 10,
                    minBarSpacing: 5,
                    lockVisibleTimeRangeOnResize: true,
                },
                rightPriceScale: {
                    borderColor: isDark ? '#2A2E39' : '#E5E7EB',
                    borderVisible: true,
                    scaleMargins: {
                        top: 0.05,
                        bottom: 0.25,
                    },
                    mode: 0, // Normal mode
                    autoScale: true,
                    alignLabels: true,
                    visible: true,
                },
                leftPriceScale: {
                    visible: false,
                },
                watermark: {
                    visible: true,
                    fontSize: 48,
                    horzAlign: 'center',
                    vertAlign: 'center',
                    color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                    text: 'DSE',
                },
                crosshair: {
                    mode: 1, // Magnet mode
                    vertLine: {
                        color: isDark ? '#6B7280' : '#9CA3AF',
                        width: 1,
                        style: 3, // Dashed
                        labelBackgroundColor: isDark ? '#1F2937' : '#E5E7EB',
                        labelVisible: true,
                    },
                    horzLine: {
                        color: isDark ? '#6B7280' : '#9CA3AF',
                        width: 1,
                        style: 3, // Dashed
                        labelBackgroundColor: isDark ? '#1F2937' : '#E5E7EB',
                        labelVisible: true,
                    },
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: true,
                },
                handleScale: {
                    axisPressedMouseMove: true,
                    mouseWheel: true,
                    pinch: true,
                    axisDoubleClickReset: true,
                },
                kineticScroll: {
                    mouse: true,
                    touch: true,
                },
            });

            chartRef.current = chart;

            // Add series based on chart type with professional colors
            let series;
            if (chartType === 'candlestick') {
                series = chart.addSeries(CandlestickSeries, {
                    upColor: '#00C805',
                    downColor: '#FF3B30',
                    borderUpColor: '#00C805',
                    borderDownColor: '#FF3B30',
                    wickUpColor: '#00C805',
                    wickDownColor: '#FF3B30',
                    priceFormat: {
                        type: 'price',
                        precision: 2,
                        minMove: 0.01,
                    },
                });
            } else if (chartType === 'line') {
                series = chart.addSeries(LineSeries, {
                    color: '#0066FF',
                    lineWidth: 2.5,
                    crosshairMarkerVisible: true,
                    crosshairMarkerRadius: 4,
                    crosshairMarkerBorderColor: '#0066FF',
                    crosshairMarkerBackgroundColor: '#0066FF',
                    lastValueVisible: true,
                    priceLineVisible: true,
                    priceFormat: {
                        type: 'price',
                        precision: 2,
                        minMove: 0.01,
                    },
                });
            } else if (chartType === 'area') {
                series = chart.addSeries(AreaSeries, {
                    lineColor: '#0066FF',
                    topColor: 'rgba(0, 102, 255, 0.3)',
                    bottomColor: 'rgba(0, 102, 255, 0.05)',
                    lineWidth: 2.5,
                    crosshairMarkerVisible: true,
                    crosshairMarkerRadius: 4,
                    lastValueVisible: true,
                    priceLineVisible: true,
                    priceFormat: {
                        type: 'price',
                        precision: 2,
                        minMove: 0.01,
                    },
                });
            } else {
                // Default to candlestick
                series = chart.addSeries(CandlestickSeries, {
                    upColor: '#00C805',
                    downColor: '#FF3B30',
                    borderUpColor: '#00C805',
                    borderDownColor: '#FF3B30',
                    wickUpColor: '#00C805',
                    wickDownColor: '#FF3B30',
                });
            }

            seriesRef.current = series;

            // Add prediction series if data is available
            if (validatedPrediction && validatedPrediction.length > 0) {
                console.log('Adding prediction series...', validatedPrediction.length, 'points');
                const predictionSeries = chart.addSeries(LineSeries, {
                    color: '#FF9500', // Orange for prediction
                    lineWidth: 2,
                    lineStyle: 2, // Dashed
                    crosshairMarkerVisible: true,
                    lastValueVisible: true,
                    priceLineVisible: false,
                    title: 'Predicted',
                });
                predictionSeries.setData(validatedPrediction);
                predictionSeriesRef.current = predictionSeries;
            }

            // Set data
            console.log('Setting chart data...');
            series.setData(validatedData);

            // Add Volume overlay for candlestick charts
            if (chartType === 'candlestick' && data.length > 0 && data[0].volume !== undefined) {
                const volumeSeries = chart.addSeries(HistogramSeries, {
                    color: isDark ? '#26a69a66' : '#26a69a44',
                    priceFormat: {
                        type: 'volume',
                    },
                    priceScaleId: '', // Use separate price scale for volume
                    scaleMargins: {
                        top: 0.8, // Position volume at bottom 20%
                        bottom: 0,
                    },
                });

                // Prepare volume data with colors based on price movement
                const volumeData = validatedData.map((item, index) => {
                    let color;
                    if (index === 0) {
                        color = '#26a69a66';
                    } else {
                        const prevClose = validatedData[index - 1].close;
                        const currentClose = item.close || item.value;
                        color = currentClose >= prevClose
                            ? (isDark ? '#00C80555' : '#00C80544')
                            : (isDark ? '#FF3B3055' : '#FF3B3044');
                    }

                    return {
                        time: item.time,
                        value: item.volume || 0,
                        color: color
                    };
                });

                volumeSeries.setData(volumeData);
                volumeSeriesRef.current = volumeSeries;
            }

            // Add price line for last price
            if (validatedData.length > 0) {
                const lastPrice = chartType === 'candlestick' ? validatedData[validatedData.length - 1].close : validatedData[validatedData.length - 1].value;
                series.createPriceLine({
                    price: lastPrice,
                    color: '#2962FF',
                    lineWidth: 2,
                    lineStyle: 2, // Dashed
                    axisLabelVisible: true,
                    title: 'Last',
                });
            }

            // Fit content to view
            if (validatedPrediction && validatedPrediction.length > 0) {
                // If we have prediction, ensure we see the future
                chart.timeScale().fitContent();
            } else {
                chart.timeScale().fitContent();
            }
            console.log('Chart created successfully with volume overlay');

            // Add crosshair move handler for legend
            chart.subscribeCrosshairMove((param) => {
                if (!param || !param.time || !param.seriesData || param.seriesData.size === 0) {
                    setLegendData(null);
                    return;
                }

                const seriesData = param.seriesData.get(series);
                if (seriesData) {
                    if (chartType === 'candlestick') {
                        setLegendData({
                            time: param.time,
                            open: seriesData.open,
                            high: seriesData.high,
                            low: seriesData.low,
                            close: seriesData.close,
                            volume: data.find(d => d.time === param.time)?.volume || 0
                        });
                    } else {
                        setLegendData({
                            time: param.time,
                            value: seriesData.value,
                            volume: data.find(d => d.time === param.time)?.volume || 0
                        });
                    }
                }

                const predData = param.seriesData.get(predictionSeriesRef.current);
                if (predData) {
                    setLegendData(prev => ({
                        ...prev,
                        prediction: predData.value
                    }));
                }
            });

            // Handle window resize
            const handleResize = () => {
                if (chartContainerRef.current && chartRef.current) {
                    chart.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: height,
                    });
                }
            };

            window.addEventListener('resize', handleResize);

            // Cleanup
            return () => {
                window.removeEventListener('resize', handleResize);
                if (chartRef.current) {
                    chart.remove();
                }
            };
        } catch (err) {
            console.error('Error creating chart:', err);
            setError(err.message || 'Failed to create chart');
        }
    }, [data, chartType, timeRange, theme, predictionData]);

    if (error) {
        return (
            <div ref={chartContainerRef} style={{ position: 'relative', width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme === 'dark' ? '#131722' : '#FFFFFF' }}>
                <div style={{ color: '#FF3B30', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>Chart Error: {error}</p>
                </div>
            </div>
        );
    }

    const formatNumber = (num) => {
        if (!num && num !== 0) return '--';
        return num.toFixed(2);
    };

    const formatVolume = (vol) => {
        if (!vol && vol !== 0) return '--';
        if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
        if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
        return vol.toFixed(0);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Legend Overlay */}
            {legendData && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: theme === 'dark' ? 'rgba(19, 23, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: `1px solid ${theme === 'dark' ? '#2A2E39' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 10,
                    minWidth: '200px',
                }}>
                    {chartType === 'candlestick' ? (
                        <>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
                                {new Date(legendData.time * 1000).toLocaleDateString()}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div><span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>O:</span> <span style={{ color: '#2962FF' }}>৳{formatNumber(legendData.open)}</span></div>
                                <div><span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>H:</span> <span style={{ color: '#00C805' }}>৳{formatNumber(legendData.high)}</span></div>
                                <div><span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>L:</span> <span style={{ color: '#FF3B30' }}>৳{formatNumber(legendData.low)}</span></div>
                                <div><span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>C:</span> <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000', fontWeight: 'bold' }}>৳{formatNumber(legendData.close)}</span></div>
                            </div>
                            {legendData.volume > 0 && (
                                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${theme === 'dark' ? '#2A2E39' : '#E5E7EB'}` }}>
                                    <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Volume:</span> <span style={{ color: '#26a69a' }}>{formatVolume(legendData.volume)}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
                                {new Date(legendData.time * 1000).toLocaleDateString()}
                            </div>
                            <div>
                                <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Price:</span> <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000', fontWeight: 'bold' }}>৳{formatNumber(legendData.value)}</span>
                            </div>
                            {legendData.volume > 0 && (
                                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${theme === 'dark' ? '#2A2E39' : '#E5E7EB'}` }}>
                                    <span style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Volume:</span> <span style={{ color: '#26a69a' }}>{formatVolume(legendData.volume)}</span>
                                </div>
                            )}
                            {legendData.prediction !== undefined && (
                                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${theme === 'dark' ? '#2A2E39' : '#E5E7EB'}` }}>
                                    <span style={{ color: '#FF9500' }}>Pred:</span> <span style={{ color: '#FF9500', fontWeight: 'bold' }}>৳{formatNumber(legendData.prediction)}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default TradingViewChart;

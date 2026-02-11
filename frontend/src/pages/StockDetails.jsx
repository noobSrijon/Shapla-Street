import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Star, ArrowUp, ArrowDown, BarChart3, TrendingUp, Activity, Brain } from 'lucide-react';
import clsx from 'clsx';
import TradingViewChart from '../components/TradingViewChart';

const StockDetails = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stock, setStock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [timeRange, setTimeRange] = useState('1M');
    const [chartType, setChartType] = useState('candlestick');
    const [chartData, setChartData] = useState([]);
    const [chartError, setChartError] = useState(null);
    const [activeView, setActiveView] = useState('chart');
    const [predictionData, setPredictionData] = useState(null);
    const [predictionHistory, setPredictionHistory] = useState(null);
    const [predictionTrend, setPredictionTrend] = useState(null);
    const [loadingPrediction, setLoadingPrediction] = useState(false);

    // Helper function to format volume with appropriate units
    const formatVolume = (volume) => {
        if (!volume || volume === 0) return '0';
        if (volume >= 1000000) return (volume / 1000000).toFixed(2) + 'M';
        if (volume >= 1000) return (volume / 1000).toFixed(2) + 'K';
        return volume.toFixed(0);
    };

    // Ensure chart data has unique and sorted timestamps
    const prepareChartData = (data) => {
        if (!data || data.length === 0) return [];
        const seen = new Set();
        return data
            .filter(item => {
                if (seen.has(item.time)) return false;
                seen.add(item.time);
                return true;
            })
            .sort((a, b) => a.time - b.time);
    };

    useEffect(() => {
        fetchStock();
        if (user) checkWatchlist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, user]);

    const loadChartData = useCallback(async () => {
        setChartData(null); // Clear old data
        setChartError(null);
        try {
            console.log(`Loading chart data for ${symbol}, range: ${timeRange}, type: ${chartType}`);
            const res = await axios.get(`/stocks/${symbol}/history?range=${timeRange}`);
            console.log('Received data:', res.data);

            if (!res.data || res.data.length === 0) {
                console.warn('No data received from API');
                setChartError('No data available for this time range');
                return;
            }


            let formattedData;

            if (chartType === 'candlestick') {
                formattedData = res.data.map(d => {
                    const timestamp = new Date(d.date).getTime() / 1000;
                    return {
                        time: timestamp,
                        open: Number(d.open),
                        high: Number(d.high),
                        low: Number(d.low),
                        close: Number(d.close),
                        volume: Number(d.volume || 0)
                    };
                }).filter(d => !isNaN(d.time) && !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close));
            } else {

                formattedData = res.data.map(d => {
                    const timestamp = new Date(d.date).getTime() / 1000;
                    return {
                        time: timestamp,
                        value: Number(d.close),
                        volume: Number(d.volume || 0)
                    };
                }).filter(d => !isNaN(d.time) && !isNaN(d.value));
            }


            formattedData.sort((a, b) => a.time - b.time);

            console.log('Formatted data:', formattedData.slice(0, 3), '... total:', formattedData.length);

            if (formattedData.length === 0) {
                setChartError('Invalid data format');
                return;
            }

            setChartData(prepareChartData(formattedData));

        } catch (err) {
            console.error('Error loading chart data:', err);
            setChartError(err.message || 'Failed to load chart data');
            setChartData(null);
        }
    }, [symbol, timeRange, chartType]);


    useEffect(() => {
        if (stock && timeRange && activeView === 'chart') {
            loadChartData();
        }
    }, [stock, timeRange, chartType, loadChartData, activeView]);

    const fetchStock = async () => {
        try {
            const res = await axios.get(`/stocks/${symbol}`);
            setStock(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const checkWatchlist = async () => {
        try {
            const res = await axios.get('/watchlist/');
            const found = res.data.find(s => s.symbol === symbol);
            setInWatchlist(!!found);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleWatchlist = async () => {
        if (!user) return navigate('/login');
        try {
            if (inWatchlist) {
                await axios.delete(`/watchlist/${symbol}`);
            } else {
                await axios.post('/watchlist/', { symbol });
            }
            setInWatchlist(!inWatchlist);
        } catch (err) {
            console.error('Watchlist error:', err);
            alert(err.response?.data?.message || 'Failed to update watchlist. Please try again.');
        }
    };

    const togglePrediction = async () => {
        if (activeView === 'prediction') {
            setActiveView('chart');
            return;
        }

        if (predictionData) {
            setActiveView('prediction');
            return;
        }

        setLoadingPrediction(true);
        try {
            const res = await axios.get(`/stocks/${symbol}/prediction`);

            if (res.data && res.data.prediction) {
                const formattedPred = res.data.prediction.map(p => ({
                    time: new Date(p.date).getTime() / 1000,
                    value: p.value
                }));

                const formattedHist = res.data.actual.map(h => ({
                    time: new Date(h.date).getTime() / 1000,
                    value: h.close
                }));

                setPredictionData(prepareChartData(formattedPred));
                setPredictionHistory(prepareChartData(formattedHist));
                setPredictionTrend(res.data.trend);
                setActiveView('prediction');
            }
        } catch (err) {
            console.error('Prediction error:', err);
            alert('Failed to generate prediction. It might take a moment to train the model.');
        } finally {
            setLoadingPrediction(false);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-3 border-secondary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-text-muted text-sm">Loading stock data...</span>
                </div>
            </div>
        );
    }

    if (!stock) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-bold text-text-main mb-2">Stock Not Found</h2>
                    <p className="text-text-muted mb-6">The stock you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2.5 bg-secondary hover:bg-blue-600 text-white font-medium rounded-lg transition-all"
                    >
                        Back to Markets
                    </button>
                </div>
            </div>
        );
    }

    const changeColor = stock.change > 0 ? 'gain' : stock.change < 0 ? 'loss' : 'neutral';

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-text-dimmed hover:text-text-main transition-colors group"
            >
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Markets</span>
            </button>


            <div className="bg-gradient-to-br from-card to-card-hover border border-border rounded-2xl overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <h1 className="text-4xl font-bold text-text-main tracking-tight">{stock.symbol}</h1>
                                <span className="px-3 py-1 bg-darker border border-border rounded-lg text-xs font-semibold text-text-muted">
                                    {stock.market_category || 'Category A'}
                                </span>
                                <button
                                    onClick={toggleWatchlist}
                                    className={clsx(
                                        "p-2 rounded-lg border transition-all hover:scale-110",
                                        inWatchlist
                                            ? "border-accent bg-accent/10 text-accent"
                                            : "border-border text-text-dimmed hover:border-accent hover:text-accent"
                                    )}
                                >
                                    <Star size={18} fill={inWatchlist ? "currentColor" : "none"} />
                                </button>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                                <span className="text-text-dimmed">Dhaka Stock Exchange</span>
                                <span className="text-text-dimmed">•</span>
                                <span className="text-text-dimmed">
                                    Updated {new Date(stock.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>


                        <div className="flex items-center space-x-8">
                            <div className="text-right">
                                <div className="text-xs text-text-dimmed uppercase tracking-wider mb-1">Last Price</div>
                                <div className="text-5xl font-bold text-text-main tabular-nums">৳{stock.ltp.toFixed(2)}</div>
                                <div className={clsx("flex items-center justify-end font-semibold text-lg mt-2 tabular-nums", changeColor)}>
                                    {stock.change > 0 ? <ArrowUp size={18} className="mr-1" /> : <ArrowDown size={18} className="mr-1" />}
                                    <span>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change > 0 ? '+' : ''}{stock.percent_change}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
                        <div>
                            <div className="text-xs text-text-dimmed uppercase tracking-wider mb-1">Open</div>
                            <div className="text-lg font-semibold text-text-main tabular-nums">৳{(stock.open || stock.ltp).toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-text-dimmed uppercase tracking-wider mb-1">Prev Close</div>
                            <div className="text-lg font-semibold text-text-main tabular-nums">৳{stock.ycp.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-text-dimmed uppercase tracking-wider mb-1">Day Range</div>
                            <div className="text-lg font-semibold text-text-main tabular-nums">{stock.low.toFixed(2)} - {stock.high.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-text-dimmed uppercase tracking-wider mb-1">Volume</div>
                            <div className="text-lg font-semibold text-text-main tabular-nums">{formatVolume(stock.volume)}</div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="bg-card border border-border rounded-xl p-4 lg:p-6 mb-6">
                <div className="flex flex-col space-y-4">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            {activeView === 'prediction' ? (
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setActiveView('chart')}
                                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                                        title="Back to Advanced Chart"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h2 className="text-lg font-bold flex items-center">
                                        <Brain className="mr-2 text-accent" size={20} />
                                        Prediction
                                    </h2>
                                </div>
                            ) : (
                                <h2 className="text-lg font-bold flex items-center">
                                    <BarChart3 size={20} className="mr-2 text-secondary" />
                                    Advanced Price Chart
                                </h2>
                            )}
                            <div className="h-4 w-px bg-border hidden sm:block"></div>
                            <div className="flex bg-background/50 p-1 rounded-lg border border-border">
                                {activeView === 'chart' && (['1D', '5D', '1M', '6M', '1Y', '2Y'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={clsx(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                            timeRange === range
                                                ? "bg-accent text-white shadow-sm"
                                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                        )}
                                    >
                                        {range}
                                    </button>
                                )))}
                                {activeView === 'prediction' && (
                                    <span className="px-3 py-1 text-xs font-medium text-accent italic">
                                        2 Year Historical Comparison
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {activeView === 'chart' && [
                                { id: 'candlestick', icon: <BarChart3 size={16} />, label: 'Candles' },
                                { id: 'area', icon: <TrendingUp size={16} />, label: 'Area' },
                                { id: 'line', icon: <Activity size={16} />, label: 'Line' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setChartType(type.id)}
                                    className={clsx(
                                        "p-2 rounded-lg border transition-all flex items-center space-x-2",
                                        chartType === type.id
                                            ? "bg-accent/10 border-accent text-accent"
                                            : "border-border text-muted-foreground hover:bg-accent/5"
                                    )}
                                    title={type.label}
                                >
                                    {type.icon}
                                    <span className="text-xs font-medium hidden md:inline">{type.label}</span>
                                </button>
                            ))}

                            <button
                                onClick={togglePrediction}
                                disabled={loadingPrediction}
                                className={clsx(
                                    "flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all shrink-0",
                                    activeView === 'prediction'
                                        ? "bg-accent text-white border-accent"
                                        : "bg-background border-border text-foreground hover:border-accent hover:text-accent"
                                )}
                            >
                                <Brain size={16} className={loadingPrediction ? "animate-pulse" : ""} />
                                <span>{loadingPrediction ? 'Analyzing...' : activeView === 'prediction' ? 'Show Chart' : 'Show Market Prediction'}</span>
                                {loadingPrediction && (
                                    <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin ml-1"></div>
                                )}
                            </button>

                            {/* Trend Indicator */}
                            {activeView === 'prediction' && predictionTrend && (
                                <div className={clsx(
                                    "flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-bold",
                                    predictionTrend === 'upward'
                                        ? "bg-green-500/10 border-green-500/30 text-green-500"
                                        : "bg-red-500/10 border-red-500/30 text-red-500"
                                )}>
                                    {predictionTrend === 'upward' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    <span className="uppercase tracking-wider">AI Trend: Might {predictionTrend}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-[500px] w-full relative overflow-hidden">
                        {chartError ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="text-danger text-4xl mb-3">⚠</div>
                                    <div className="text-danger font-medium">{chartError}</div>
                                </div>
                            </div>
                        ) : (activeView === 'chart' ? chartData : predictionHistory) ? (
                            <TradingViewChart
                                data={activeView === 'prediction' ? predictionHistory : chartData}
                                chartType={activeView === 'prediction' ? 'line' : chartType}
                                timeRange={activeView === 'prediction' ? '2Y' : timeRange}
                                predictionData={activeView === 'prediction' ? predictionData : null}
                                height={500}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="w-10 h-10 border-3 border-secondary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-text-muted text-sm">Loading chart...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wider flex items-center">
                        <Activity size={16} className="mr-2 text-primary" />
                        Today's Trading
                    </h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Open', value: `৳${(stock.open || stock.ltp).toFixed(2)}`, color: null },
                            { label: 'High', value: `৳${stock.high.toFixed(2)}`, color: 'text-primary' },
                            { label: 'Low', value: `৳${stock.low.toFixed(2)}`, color: 'text-danger' },
                            { label: 'Prev Close', value: `৳${stock.ycp.toFixed(2)}`, color: null },
                            { label: 'Volume', value: formatVolume(stock.volume), color: null },
                            { label: 'Trades', value: stock.trade?.toLocaleString() || 'N/A', color: null },
                            { label: 'Value', value: stock.value ? `৳${(stock.value).toFixed(2)}M` : 'N/A', color: null },
                        ].map((stat, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                <span className="text-xs text-text-dimmed uppercase tracking-wide">{stat.label}</span>
                                <span className={clsx("font-bold text-sm tabular-nums", stat.color || "text-text-main")}>
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wider flex items-center">
                        <BarChart3 size={16} className="mr-2 text-primary" />
                        Financial Metrics
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                label: 'Market Cap',
                                value: stock.market_cap ? `৳${(stock.market_cap).toFixed(2)}M` : 'N/A',
                                highlight: true
                            },
                            {
                                label: 'P/E Ratio',
                                value: stock.pe_basic || (stock.eps_basic && stock.ltp ? (stock.ltp / stock.eps_basic).toFixed(2) : 'N/A'),
                                highlight: true
                            },
                            {
                                label: 'EPS',
                                value: stock.eps_basic ? `৳${stock.eps_basic.toFixed(2)}` : 'N/A'
                            },
                            {
                                label: 'NAV',
                                value: stock.nav_original ? `৳${stock.nav_original.toFixed(2)}` : 'N/A'
                            },
                            {
                                label: 'Dividend %',
                                value: stock.dividend_yield ? `${stock.dividend_yield}%` : 'N/A'
                            },
                            {
                                label: '52W High',
                                value: stock.week_52_high ? `৳${stock.week_52_high.toFixed(2)}` : 'N/A'
                            },
                            {
                                label: '52W Low',
                                value: stock.week_52_low ? `৳${stock.week_52_low.toFixed(2)}` : 'N/A'
                            },
                        ].map((stat, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                <span className="text-xs text-text-dimmed uppercase tracking-wide">{stat.label}</span>
                                <span className={clsx(
                                    "font-bold text-sm tabular-nums",
                                    stat.highlight ? "text-secondary" : "text-text-main"
                                )}>
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wider flex items-center">
                        <TrendingUp size={16} className="mr-2 text-primary" />
                        Company Info
                    </h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Sector', value: stock.sector || 'N/A' },
                            { label: 'Category', value: stock.category || 'N/A' },
                            { label: 'Face Value', value: stock.face_value ? `৳${stock.face_value}` : 'N/A' },
                            { label: 'Market Lot', value: stock.market_lot || 'N/A' },
                            { label: 'Listing Year', value: stock.listing_year || 'N/A' },
                            { label: 'Auth Capital', value: stock.authorized_capital || 'N/A' },
                            { label: 'Paid-up Cap', value: stock.paid_up_capital || 'N/A' },
                        ].map((stat, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                <span className="text-xs text-text-dimmed uppercase tracking-wide">{stat.label}</span>
                                <span className="font-semibold text-xs text-text-main text-right max-w-[60%] truncate">
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wider flex items-center">
                        <Activity size={16} className="mr-2 text-primary" />
                        Trading Signals
                    </h2>

                    <div className="mb-4 p-3 rounded-lg bg-darker border border-border">
                        <div className="text-xs text-text-dimmed uppercase tracking-wide mb-1">Day Change</div>
                        <div className={clsx("text-2xl font-bold tabular-nums", changeColor)}>
                            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percent_change}%)
                        </div>
                    </div>

                    <div className="mb-4 p-3 rounded-lg bg-darker border border-border">
                        <div className="text-xs text-text-dimmed uppercase tracking-wide mb-2">Volume</div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-dimmed">Today</span>
                            <span className="font-bold text-text-main">{formatVolume(stock.volume)}</span>
                        </div>
                        <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <div className="text-xs text-text-dimmed mt-1">Above average</div>
                    </div>

                    <div className="p-3 rounded-lg bg-darker border border-border">
                        <div className="text-xs text-text-dimmed uppercase tracking-wide mb-2">Momentum</div>
                        <div className="flex items-center justify-center">
                            {stock.change > 1 ? (
                                <div className="text-center">
                                    <div className="text-2xl">🚀</div>
                                    <div className="text-xs font-bold text-primary mt-1">Strong Buy</div>
                                </div>
                            ) : stock.change > 0 ? (
                                <div className="text-center">
                                    <div className="text-2xl">📈</div>
                                    <div className="text-xs font-bold text-primary mt-1">Bullish</div>
                                </div>
                            ) : stock.change < -1 ? (
                                <div className="text-center">
                                    <div className="text-2xl">📉</div>
                                    <div className="text-xs font-bold text-danger mt-1">Strong Sell</div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="text-2xl">➡️</div>
                                    <div className="text-xs font-bold text-text-muted mt-1">Neutral</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockDetails;

import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import { Search, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const Dashboard = () => {
    const [stocks, setStocks] = useState([]);
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchIndices();
        fetchStocks();
    }, [page]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            fetchStocks();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchIndices = async () => {
        try {
            const res = await axios.get('/stocks/indices');
            setIndices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStocks = async () => {
        setLoading(true);
        try {
            if (!searchTerm) {
                const res = await axios.get(`/stocks/latest-prices`);
                const limit = 20;
                setStocks(res.data.slice((page - 1) * limit, page * limit));
                setTotalPages(Math.ceil(res.data.length / limit));
            } else {
                const res = await axios.get(`/stocks/`, {
                    params: { search: searchTerm, page: page, limit: 20 }
                });
                setStocks(res.data.stocks);
                setTotalPages(res.data.pages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getChangeColor = (change) => change > 0 ? 'gain' : change < 0 ? 'loss' : 'neutral';
    const formatValue = (value) => value >= 1000 ? (value / 1000).toFixed(2) + 'K' : value.toLocaleString();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-text-main mb-4">Market Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {indices.length > 0 ? indices.map((idx) => (
                        <div key={idx.name} className="bg-card border border-border rounded-xl p-6 hover:border-secondary/30 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-text-dimmed text-xs font-semibold uppercase tracking-wider mb-1">{idx.name}</h3>
                                    <div className="text-3xl font-bold text-text-main tabular-nums">
                                        {idx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className={clsx("p-2 rounded-lg", idx.change > 0 ? "bg-primary/10" : idx.change < 0 ? "bg-danger/10" : "bg-card-hover")}>
                                    {idx.change > 0 ? <TrendingUp size={20} className="text-primary" /> : idx.change < 0 ? <TrendingDown size={20} className="text-danger" /> : <Minus size={20} className="text-text-muted" />}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={clsx("text-sm font-semibold tabular-nums flex items-center", getChangeColor(idx.change))}>
                                    {idx.change > 0 ? <ArrowUp size={14} className="mr-1" /> : idx.change < 0 ? <ArrowDown size={14} className="mr-1" /> : null}
                                    {idx.change > 0 ? '+' : ''}{idx.change} ({idx.change > 0 ? '+' : ''}{idx.percent_change}%)
                                </span>
                                <span className="text-xs text-text-dimmed">{new Date(idx.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 bg-card border border-border rounded-xl p-8 text-center text-text-muted">Loading Market Overview...</div>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Live Market Prices</h2>
                        <p className="text-xs text-text-dimmed mt-1">Real-time data from Dhaka Stock Exchange</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dimmed" size={18} />
                        <input
                            type="text" placeholder="Search by symbol..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-darker border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-text-main placeholder-text-dimmed transition"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full">
                        <thead className="bg-darker text-text-dimmed text-xs uppercase tracking-wider border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Symbol</th>
                                <th className="px-6 py-4 text-right font-semibold">Last Price</th>
                                <th className="px-6 py-4 text-right font-semibold">Change</th>
                                <th className="px-6 py-4 text-right font-semibold">% Change</th>
                                <th className="px-6 py-4 text-right font-semibold">High</th>
                                <th className="px-6 py-4 text-right font-semibold">Low</th>
                                <th className="px-6 py-4 text-right font-semibold">Volume</th>
                                <th className="px-6 py-4 text-right font-semibold">Value (mn)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-text-muted">Loading market data...</td>
                                </tr>
                            ) : stocks.length > 0 ? (
                                stocks.map((stock, idx) => (
                                    <tr key={stock._id || idx} className="hover:bg-card-hover transition-colors cursor-pointer group" onClick={() => window.location.href = `/stocks/${stock.symbol}`}>
                                        <td className="px-6 py-4"><Link to={`/stocks/${stock.symbol}`} className="font-semibold text-text-main group-hover:text-secondary transition-colors text-sm">{stock.symbol}</Link></td>
                                        <td className="px-6 py-4 text-right font-semibold text-text-main tabular-nums">৳{stock.ltp.toFixed(2)}</td>
                                        <td className={clsx("px-6 py-4 text-right font-semibold tabular-nums text-sm", getChangeColor(stock.change))}>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums", stock.change > 0 ? "bg-primary/10 text-primary" : stock.change < 0 ? "bg-danger/10 text-danger" : "bg-card-hover text-text-muted")}>
                                                {stock.change > 0 ? <ArrowUp size={12} className="mr-1" /> : stock.change < 0 ? <ArrowDown size={12} className="mr-1" /> : null}
                                                {stock.percent_change}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-text-muted text-sm tabular-nums">{stock.high.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-text-muted text-sm tabular-nums">{stock.low.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-text-dimmed text-sm tabular-nums">{formatValue(stock.volume)}</td>
                                        <td className="px-6 py-4 text-right text-text-dimmed text-sm tabular-nums">{stock.value ? stock.value.toFixed(2) : 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="px-6 py-12 text-center text-text-muted">No stocks found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="bg-darker px-6 py-4 border-t border-border flex items-center justify-between">
                        <div className="text-sm text-text-muted">Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, stocks.length)} of {totalPages * 20} stocks</div>
                        <div className="flex items-center space-x-2">
                            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 bg-card hover:bg-card-hover border border-border rounded-lg text-sm text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center space-x-1">
                                <ChevronLeft size={16} /><span>Previous</span>
                            </button>
                            <div className="flex items-center space-x-1">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum = totalPages <= 5 ? i + 1 : (page <= 3 ? i + 1 : (page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i));
                                    return (
                                        <button key={i} onClick={() => setPage(pageNum)} className={clsx("w-9 h-9 rounded-lg text-sm font-medium transition-all", page === pageNum ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "bg-card hover:bg-card-hover text-text-muted hover:text-text-main")}>{pageNum}</button>
                                    );
                                })}
                            </div>
                            <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-2 bg-card hover:bg-card-hover border border-border rounded-lg text-sm text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center space-x-1">
                                <span>Next</span><ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

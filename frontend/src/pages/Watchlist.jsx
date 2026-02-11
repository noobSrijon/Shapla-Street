import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Trash2, Star, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

const Watchlist = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const fetchWatchlist = async () => {
        try {
            const res = await axios.get('/watchlist/');
            setStocks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWatchlist = async (symbol) => {
        try {
            await axios.delete(`/watchlist/${symbol}`);
            setStocks(stocks.filter(s => s.symbol !== symbol));
        } catch (err) {
            console.error(err);
        }
    };

    const getChangeColor = (change) => {
        if (change > 0) return 'gain';
        if (change < 0) return 'loss';
        return 'neutral';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <div className="p-3 bg-accent/10 rounded-xl">
                    <Star size={24} className="text-accent" fill="currentColor" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-text-main">My Watchlist</h1>
                    <p className="text-sm text-text-dimmed">Track your favorite stocks</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-10 h-10 border-3 border-secondary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-text-muted text-sm">Loading watchlist...</span>
                        </div>
                    </div>
                ) : stocks.length > 0 ? (
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
                                    <th className="px-6 py-4 text-center font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {stocks.map((stock) => (
                                    <tr key={stock._id} className="hover:bg-card-hover transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/stocks/${stock.symbol}`}
                                                className="font-semibold text-text-main group-hover:text-secondary transition-colors flex items-center space-x-2"
                                            >
                                                <span>{stock.symbol}</span>
                                                <TrendingUp size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-text-main tabular-nums">
                                            ৳{stock.ltp.toFixed(2)}
                                        </td>
                                        <td className={clsx("px-6 py-4 text-right font-semibold tabular-nums text-sm", getChangeColor(stock.change))}>
                                            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={clsx(
                                                "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums",
                                                stock.change > 0 ? "bg-primary/10 text-primary" :
                                                    stock.change < 0 ? "bg-danger/10 text-danger" :
                                                        "bg-card-hover text-text-muted"
                                            )}>
                                                {stock.change > 0 ? <ArrowUp size={12} className="mr-1" /> :
                                                    stock.change < 0 ? <ArrowDown size={12} className="mr-1" /> : null}
                                                {stock.percent_change}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-text-muted text-sm tabular-nums">{stock.high.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-text-muted text-sm tabular-nums">{stock.low.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-text-dimmed text-sm tabular-nums">{(stock.volume / 1000000).toFixed(2)}M</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => removeFromWatchlist(stock.symbol)} className="p-2 text-text-dimmed hover:text-danger hover:bg-danger/10 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="p-6 bg-darker rounded-full mb-4">
                            <Star size={48} className="text-text-dimmed" />
                        </div>
                        <h3 className="text-xl font-bold text-text-main mb-2">Your watchlist is empty</h3>
                        <p className="text-text-muted text-sm mb-6">Start adding stocks to track your favorites</p>
                        <Link to="/" className="px-6 py-2.5 bg-secondary hover:bg-opacity-80 text-white font-semibold rounded-lg transition-all">
                            Browse Markets
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Watchlist;

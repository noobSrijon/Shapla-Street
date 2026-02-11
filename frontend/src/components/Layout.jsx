import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, List, LogOut, User, Activity, Sun, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import WaterLilyLogo from './WaterLilyLogo';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import axios from '../api/axios';

const Layout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [tickerStocks, setTickerStocks] = useState([]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    useEffect(() => {
        const fetchTickerStocks = async () => {
            try {
                const res = await axios.get('/stocks/latest-prices');
                // Get 10 random stocks for the ticker
                const shuffled = res.data.sort(() => 0.5 - Math.random());
                setTickerStocks(shuffled.slice(0, 10));
            } catch (err) {
                console.error('Failed to fetch ticker stocks:', err);
            }
        };

        fetchTickerStocks();
        // Refresh ticker every 10 seconds
        const interval = setInterval(fetchTickerStocks, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-dark text-text-main flex flex-col">
            {/* Top Bar - Live Stock Ticker */}
            <div className="bg-darker border-b border-border overflow-hidden">
                <div className="max-w-[1600px] mx-auto px-6 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <Activity size={14} className="text-primary" />
                            <span className="text-text-muted">Market Status:</span>
                            <span className="text-danger font-semibold">Post Closing</span>
                        </div>
                        <div className="text-text-dimmed">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                    
                    {/* Live Stock Ticker */}
                    <div className="flex items-center space-x-4 overflow-hidden relative h-5">
                        {tickerStocks.slice(0, 3).map((stock, idx) => (
                            <Link
                                key={`${stock.symbol}-${idx}`}
                                to={`/stocks/${stock.symbol}`}
                                className="flex items-center space-x-2 whitespace-nowrap ticker-animate hover:opacity-70 transition-opacity cursor-pointer"
                            >
                                <span className="text-text-main font-semibold">{stock.symbol}</span>
                                <span className="text-text-dimmed">৳{stock.ltp.toFixed(2)}</span>
                                <span className={clsx(
                                    "flex items-center font-semibold",
                                    stock.change > 0 ? "text-primary" : stock.change < 0 ? "text-danger" : "text-text-muted"
                                )}>
                                    {stock.change > 0 ? <TrendingUp size={12} className="mr-0.5" /> : 
                                     stock.change < 0 ? <TrendingDown size={12} className="mr-0.5" /> : null}
                                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                                </span>
                                {idx < 2 && <span className="text-text-dimmed ml-2">•</span>}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="bg-secondary p-2 rounded-lg">
                                <WaterLilyLogo className="w-6 h-6" color="white" />
                            </div>
                            <span className="text-2xl font-bold text-text-main">
                            Shapla Street
                        </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-1">
                            <Link 
                                to="/" 
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2",
                                    isActive('/') && !location.pathname.includes('/stocks/')
                                        ? "bg-darker text-text-main" 
                                        : "text-text-muted hover:text-text-main hover:bg-darker"
                                )}
                            >
                                <LayoutDashboard size={16} />
                                <span>Markets</span>
                            </Link>
                            {user && (
                                <Link 
                                    to="/watchlist" 
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2",
                                        isActive('/watchlist') 
                                            ? "bg-darker text-text-main" 
                                            : "text-text-muted hover:text-text-main hover:bg-darker"
                                    )}
                                >
                                    <List size={16} />
                                    <span>Watchlist</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-text-muted hover:text-text-main hover:bg-darker rounded-lg transition-all"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {user ? (
                            <div className="flex items-center space-x-4">
                                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-darker rounded-lg">
                                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                                    <User size={16} className="text-white" />
                                </div>
                                    <span className="text-sm font-medium text-text-main">{user.name}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-text-muted hover:text-danger hover:bg-darker rounded-lg transition-all"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link 
                                    to="/login" 
                                    className="px-4 py-2 text-sm font-medium text-text-main hover:text-secondary transition"
                                >
                                    Login
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="px-4 py-2 bg-secondary hover:bg-opacity-80 text-white font-semibold text-sm rounded-lg transition-all"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow max-w-[1600px] mx-auto w-full px-6 py-6">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-card border-t border-border">
                <div className="max-w-[1600px] mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center text-xs text-text-dimmed">
                        <div>
                            &copy; {new Date().getFullYear()} Shapla Street. All rights reserved.
                        </div>
                        <div className="flex items-center space-x-4 mt-2 md:mt-0">
                            <span>Powered by Dhaka Stock Exchange</span>
                            <span>•</span>
                            <span>Real-time market data</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;

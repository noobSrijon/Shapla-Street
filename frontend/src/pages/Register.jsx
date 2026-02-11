import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import WaterLilyLogo from '../components/WaterLilyLogo';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Email may already be in use.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark text-text-main py-12 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center space-x-2 mb-4">
                        <div className="bg-secondary p-3 rounded-xl">
                            <WaterLilyLogo className="w-8 h-8" color="white" />
                        </div>
                        <span className="text-3xl font-bold text-text-main">
                            Shapla Street
                        </span>
                    </div>
                    <p className="text-text-muted text-sm">Create your account to start investing</p>
                </div>

                {/* Register Card */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold mb-6 text-text-main">Create Account</h2>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-start space-x-3">
                            <AlertCircle size={18} className="text-danger mt-0.5" />
                            <p className="text-danger text-sm font-medium">{error}</p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-text-muted text-sm font-medium mb-2">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dimmed" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-darker border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-text-main placeholder-text-dimmed transition"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-text-muted text-sm font-medium mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dimmed" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-darker border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-text-main placeholder-text-dimmed transition"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-text-muted text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dimmed" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-darker border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-text-main placeholder-text-dimmed transition"
                                    placeholder="Create a strong password"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-secondary hover:bg-opacity-80 text-white font-semibold py-3 rounded-lg transition-all"
                        >
                            Create Account
                        </button>
                    </form>
                    
                    <div className="mt-6 pt-6 border-t border-border text-center">
                        <p className="text-text-muted text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-secondary hover:text-blue-400 font-semibold transition">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

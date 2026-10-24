import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { ShieldAlert, Mail, Lock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide administrator email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login({ email, password });
      if (data.user.role !== 'admin') {
        setError('Access denied. This account does not possess administrator credentials.');
        return;
      }

      login(data.token, data.user);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@aistudymanager.com');
    setPassword('AdminSecure123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white mx-auto flex items-center justify-center shadow-sm mb-4 border border-gray-800">
          <ShieldAlert className="w-6 h-6 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Administrator Control Portal
        </h1>
        <p className="mt-1.5 text-xs text-gray-500">
          Restricted access for academic system administration and compliance auditing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 border border-gray-200 rounded-3xl shadow-card">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-orange-50 border border-orange-200 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aistudymanager.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                  <span>Authenticate as Administrator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Fill Demo Admin Credentials Button */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="w-full py-2 px-3 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-center"
            >
              Autofill provisioned admin credentials
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Student Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

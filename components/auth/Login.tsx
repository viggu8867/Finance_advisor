import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      // On successful login, the App component will automatically render the dashboard
    } catch (err: any) {
      setError(err.message || 'Failed to log in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold text-center text-base-content mb-2">Welcome Back!</h2>
      <p className="text-center text-gray-500 mb-6">Log in to access your financial dashboard.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</p>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <Button type="submit" isLoading={isLoading} className="w-full">
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignup} className="font-medium text-primary hover:text-secondary">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;
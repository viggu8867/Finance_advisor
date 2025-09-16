import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

interface SignupProps {
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signup({ email, password });
      // On successful signup & login, the App component will automatically render the dashboard
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold text-center text-base-content mb-2">Create Your Account</h2>
      <p className="text-center text-gray-500 mb-6">Start your journey to financial wellness.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</p>}
        <div>
          <label htmlFor="email-signup" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email-signup"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password-signup"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            id="confirm-password-signup"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <Button type="submit" isLoading={isLoading} className="w-full">
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="font-medium text-primary hover:text-secondary">
          Log in
        </button>
      </p>
    </div>
  );
};

export default Signup;
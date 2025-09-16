import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const Auth: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen bg-neutral flex flex-col justify-center items-center p-4">
       <div className="absolute top-8 text-3xl font-bold text-primary">
            FinAdvisor AI
       </div>
      <div className="w-full max-w-md bg-base-100 p-8 rounded-2xl shadow-xl">
        {isLoginView ? (
          <Login onSwitchToSignup={() => setIsLoginView(false)} />
        ) : (
          <Signup onSwitchToLogin={() => setIsLoginView(true)} />
        )}
      </div>
       <p className="text-xs text-gray-500 text-center mt-8">&copy; 2024 FinAdvisor AI. All rights reserved.</p>
    </div>
  );
};

export default Auth;

import React, { useState, useEffect } from 'react';
import { LogIn, ArrowLeft } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './components/LoginPage';
import AuthPopup from './components/AuthPopup';
import HomePage from './components/HomePage';
import MyOrdersPage from './components/MyOrdersPage';
import SellerDashboard from './components/SellerDashboard';  
import RewardRoad from './components/rroad/src/app/App';
import './components/rroad/src/styles/index.css';
import AccountCredentialsPage from './components/AccountCredentialsPage';
import ProfileDropdown from './components/ProfileDropdown';
import AdminPanel from './components/AdminPanel';
import './App.css';

// Inner component that uses useAuth
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const TRANSITION_TIME_MS = 500;


  const handleLogin = (code) => {

    const validCodes = [
      import.meta.env.VITE_R_ACCESS_CODE,
      import.meta.env.VITE_V_ACCESS_CODE,
      import.meta.env.VITE_L_ACCESS_CODE,
      import.meta.env.VITE_P_ACCESS_CODE
    ];
    if (validCodes.includes(code)) {
      setIsValidating(true);

      setTimeout(() => {
        setIsFadingOut(true);
      }, 1000);

      setTimeout(() => {
        setIsLoggedIn(true);
      }, 800 + TRANSITION_TIME_MS);

      return true;
    }
    return false;
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleAuthRequired = () => {
    setShowAuthPopup(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'ordertracking':
        return <MyOrdersPage onBack={handleNavigate} />;
      case 'sellerdashboard':                             // ← NEW
        return <SellerDashboard onBack={handleNavigate} />;
      case 'rewardRoad':
        return (
          <>
            <div style={{ padding: '20px', position: 'relative', zIndex: 10 }}>
              <button onClick={() => handleNavigate('home')} className="back-button">
                <ArrowLeft size={20} />
                <span>Back to Home</span>
              </button>
            </div>
            <div className="rroad-container">
              <RewardRoad />
            </div>
          </>
        );
      case 'accountcredential':
        return <AccountCredentialsPage onBack={handleNavigate} />;
      case 'admin':
        return <AdminPanel onBack={handleNavigate} />;
      default:
        return <HomePage shouldFadeIn={true} />;
    }
  };

  return (
    <div className="App">
      {!isLoggedIn && (
        <LoginPage
          onLogin={handleLogin}
          isFadingOut={isFadingOut}
          isValidating={isValidating}
        />
      )}
      {isLoggedIn && (
        <>
          {!user && (
            <button
              className="login-button"
              onClick={() => setShowAuthPopup(true)}
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
          )}
          <header className="app-header">
            <ProfileDropdown
              onNavigate={handleNavigate}
              onAuthRequired={handleAuthRequired}
            />
          </header>
          {renderPage()}
        </>
      )}
      {showAuthPopup && (
        <AuthPopup onClose={() => setShowAuthPopup(false)} />
      )}
    </div>
  );
}

// Main App component with AuthProvider and snowflakes
function App() {
  useEffect(() => {
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.classList.add('snowflake');
      snowflake.innerHTML = '❄';

      const startPosition = Math.random() * window.innerWidth;
      const duration = Math.random() * 3 + 5;
      const size = Math.random() * 0.5 + 0.5;
      const opacity = Math.random() * 0.5 + 0.3;

      snowflake.style.left = startPosition + 'px';
      snowflake.style.animationDuration = duration + 's';
      snowflake.style.fontSize = size + 'em';
      snowflake.style.opacity = opacity;

      document.body.appendChild(snowflake);

      setTimeout(() => {
        snowflake.remove();
      }, duration * 1000);
    };

    for (let i = 0; i < 20; i++) {
      setTimeout(createSnowflake, i * 100);
    }

    const interval = setInterval(createSnowflake, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
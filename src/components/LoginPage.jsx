import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

function LoginPage({ onLogin, isFadingOut, isValidating }) {
  const [referralCode, setReferralCode] = useState('');
  const [showError, setShowError] = useState(false);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const code = referralCode.trim();

    // Check if referral code is filled
    if (!code) {
      setShowError(true);
      return;
    }

    // Save referral code to sessionStorage
    sessionStorage.setItem('referralCode', code);

    // Try to login with the referral code
    const success = onLogin(code);

    if (!success) {
      setShowError(true);
      setReferralCode('');
      // Clear referral code from storage if login failed
      sessionStorage.removeItem('referralCode');
    }
  };

  return (
    <div className={`login-container ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
      <div className={`login-content ${isFadingOut ? 'fade-out' : ''}`}>
        <img src="/Shopbuster.png" className="logo" alt="Shopbuster Logo" />

        <input
          type="text"
          className="input-box"
          placeholder="Enter your access code"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isValidating}
        />

        <div className={`success-message ${isValidating ? 'show' : ''}`}>
          <Loader2 className="loading-spinner" />
          Valid access code!
        </div>

        <div className={`error-message ${showError ? 'show' : ''}`}>
          Invalid access code
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
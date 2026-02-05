import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const AuthPopup = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation for registration
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // Login
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password');
          } else {
            setError(error.message);
          }
        } else {
          onClose();
        }
      } else {
        // Sign up
        const { data, error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Email already exists');
          } else {
            setError(error.message);
          }
        } else {
          // Create user profile after successful signup (with just email)
          if (data.user) {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert([
                {
                  id: data.user.id,
                  email: email,
                  full_name: '',  // Empty, user can fill later
                  phone: ''       // Empty, user can fill later
                }
              ]);

            if (profileError) {
              console.error('Error creating profile:', profileError);
            }
          }
          setError('');
          setShowSuccess(true); // Show the nice UI instead of an alert
          
          // Wait 3 seconds, then hide success and switch to login
          setTimeout(() => {
            setShowSuccess(false);
            setIsLogin(true);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
          }, 5000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('')
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-form auth-popup" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>×</button>
        <h2 className="popup-title">{isLogin ? 'Login' : 'Create Account'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input full-width"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input full-width"
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-input full-width"
              />
            )}
          </div>

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button type="button" onClick={toggleMode} className="auth-toggle-btn">
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={toggleMode} className="auth-toggle-btn">
                Login
              </button>
            </p>
          )}
        </div>
      </div>
      {showSuccess && (
        <div className="success-overlay auth-success-overlay">
          <div className="success-message-box bounce-in">
            <div className="success-icon">✓</div>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>Account Created!</h3>
            <p className="success-text">Please check your email to verify your account.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPopup;
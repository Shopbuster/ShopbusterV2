import React, { useState } from 'react';
import { User, Package, Key, LogOut, Shield, Gift, BarChart3 } from 'lucide-react';
import { useAuth } from '../AuthContext';


const ProfileDropdown = ({ onNavigate, onAuthRequired }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAdmin, isSeller } = useAuth();

  const handleNavigation = (path) => {
      if (!user) {
        // User not logged in, show auth popup
        if (onAuthRequired) {
          onAuthRequired();
        }
        setIsOpen(false);
        return;
      }

      if (onNavigate) {
        onNavigate(path);
      }
      setIsOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className="profile-dropdown-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="profile-icon" onClick={handleClick}>
        <User size={24} color="#1A1A1A" />
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          <button
            className="dropdown-item"
            onClick={() => handleNavigation('ordertracking')}
          >
            <Package size={18} />
            <span>My Orders</span>
          </button>
          <button
            className="dropdown-item"
            onClick={() => handleNavigation('rewardRoad')}
          >
            <Gift size={18} />
            <span>Reward Road</span>
          </button>
          <button
            className="dropdown-item"
            onClick={() => handleNavigation('accountcredential')}
          >
            <Key size={18} />
            <span>Credentials</span>
          </button>
          {isSeller && (
            <button
              className="dropdown-item"
              onClick={() => handleNavigation('sellerdashboard')}
            >
              <BarChart3 size={18} />
              <span>Seller Dashboard</span>
            </button>
          )}
          {isAdmin && (
            <button
              className="dropdown-item"
              onClick={() => {
                setIsOpen(false);
                onNavigate('admin');
              }}
            >
              <Shield size={18} />
              <span>Admin Panel</span>
            </button>
          )}
          {user && (
              <>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item dropdown-item-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
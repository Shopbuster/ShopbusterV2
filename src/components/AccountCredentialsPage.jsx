import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

function AccountCredentialsPage({ onBack }) {
  const { user } = useAuth();
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '••••••••••' // We can't show real password
      });
      const [loading, setLoading] = useState(true);

      // Fetch user data on component mount
      useEffect(() => {
        const fetchUserData = async () => {
          if (!user) {
            setLoading(false);
            return;
          }

          try {
            // Fetch from user_profiles table
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('full_name, email, phone')
              .eq('id', user.id)
              .single();

            if (error) throw error;

            const formatPhoneForDisplay = (phone) => {
              if (!phone) return 'Not set';
              const cleaned = phone.replace(/\D/g, '');
              if (cleaned.length === 10) {
                return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
              }
              return phone;
            };

            setUserData({
              name: profile?.full_name || 'Not set',
              email: profile?.email || 'Not set',
              phone: formatPhoneForDisplay(profile?.phone),
              password: '••••••••••'
            });
          } catch (error) {
            console.error('Error fetching user data:', error);
          } finally {
            setLoading(false);
          }
        };

        fetchUserData();
      }, [user]);

  const [editModal, setEditModal] = useState({
    isOpen: false,
    field: null,
    value: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Open edit modal
  const handleEdit = (field) => {
    setEditModal({
      isOpen: true,
      field: field,
      value: field === 'password' ? '' : userData[field],
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  // Close modal
  const handleCloseModal = () => {
    setEditModal({
      isOpen: false,
      field: null,
      value: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone
  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const formatPhoneNumber = (value) => {
  // Remove all non-digits
      const phoneNumber = value.replace(/\D/g, '');

      // Format as (XXX) XXX-XXXX
      if (phoneNumber.length <= 3) {
        return phoneNumber;
      } else if (phoneNumber.length <= 6) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
      } else {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
      }
  };

  // Validate password
  const validatePassword = (password) => {
    return password.length >= 8;
  };

  // Handle save
  const handleSave = async () => {
    const newErrors = {};

    // Validation based on field
    if (editModal.field === 'name') {
      if (editModal.value.trim().length < 2) {
        newErrors.value = 'Name must be at least 2 characters';
      }
    } else if (editModal.field === 'email') {
      if (!validateEmail(editModal.value)) {
        newErrors.value = 'Please enter a valid email address';
      }
    } else if (editModal.field === 'phone') {
      if (!validatePhone(editModal.value)) {
        newErrors.value = 'Please enter a valid phone number (at least 10 digits)';
      }
    } else if (editModal.field === 'password') {
      // Check new password
      if (!validatePassword(editModal.newPassword)) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      // Check password match
      if (editModal.newPassword !== editModal.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Update based on field
      if (editModal.field === 'password') {
        setSaving(true);
        
        try {
          const { data, error } = await supabase.auth.updateUser({
            password: editModal.newPassword
          });

          if (error) throw error;

          if (data.session) {
          }
          
          handleCloseModal();
          setSuccessMessage('Password updated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
          console.error('Password update error:', error);
          setErrors({ newPassword: error.message });
        } finally {
          setSaving(false);
        }
        
        return;
      
      }else if (editModal.field === 'email') {
        // Update email in both auth and user_profiles
        const { error: authError } = await supabase.auth.updateUser({
          email: editModal.value
        });
        
        if (authError) throw authError;

        // Update in user_profiles table
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ email: editModal.value })
          .eq('id', user.id);

        if (profileError) throw profileError;

        setUserData({ ...userData, email: editModal.value });
        
      } else {
        // Update name or phone in user_profiles table only
        const updateData = {};
        
        if (editModal.field === 'name') {
          updateData.full_name = editModal.value;
        } else if (editModal.field === 'phone') {
          updateData.phone = editModal.value.replace(/\D/g, '');
        }

        // Update in user_profiles table
        const { error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;

        setUserData({ ...userData, [editModal.field]: editModal.value });
      }

      // Show success message (won't reach here for password since it returns early)
      setSuccessMessage(`${editModal.field.charAt(0).toUpperCase() + editModal.field.slice(1)} updated successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Close modal
      handleCloseModal();
    } catch (error) {
      console.error('Error updating user data:', error);
      setErrors({ value: error.message || 'Failed to update. Please try again.' });
    }
  };

  // Render edit modal content
  const renderModalContent = () => {
    if (editModal.field === 'password') {
      return (
        <>
          <div className="modal-field">
            <label className="modal-label">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showModalPassword.new ? 'text' : 'password'}
                value={editModal.newPassword}
                onChange={(e) => setEditModal({ ...editModal, newPassword: e.target.value })}
                className="modal-input"
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowModalPassword({ ...showModalPassword, new: !showModalPassword.new })}
              >
                {showModalPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
          </div>

          <div className="modal-field">
            <label className="modal-label">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showModalPassword.confirm ? 'text' : 'password'}
                value={editModal.confirmPassword}
                onChange={(e) => setEditModal({ ...editModal, confirmPassword: e.target.value })}
                className="modal-input"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowModalPassword({ ...showModalPassword, confirm: !showModalPassword.confirm })}
              >
                {showModalPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>
        </>
      );
    } else {
      return (
        <div className="modal-field">
          <label className="modal-label">
            {editModal.field === 'name' && 'Name'}
            {editModal.field === 'email' && 'Email'}
            {editModal.field === 'phone' && 'Primary mobile number'}
          </label>
          <input
            type={editModal.field === 'email' ? 'email' : editModal.field === 'phone' ? 'tel' : 'text'}
            value={editModal.value}
            onChange={(e) => {
              if (editModal.field === 'phone') {
                const formattedPhone = formatPhoneNumber(e.target.value);
                setEditModal({ ...editModal, value: formattedPhone });
              } else {
                setEditModal({ ...editModal, value: e.target.value });
              }
            }}
            className="modal-input"
            placeholder={`Enter your ${editModal.field}`}
          />
          {errors.value && <span className="error-text">{errors.value}</span>}
        </div>
      );
    }
  };

// Loading state
if (loading) {
  return (
    <div className="credentials-page">
      <div className="credentials-header">
        <button onClick={() => onBack('home')} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <h1 className="credentials-title">Login & Security</h1>
      </div>
      <div className="credentials-container">
        <p>Loading your information...</p>
      </div>
    </div>
  );
}

// Not logged in state
if (!user) {
  return (
    <div className="credentials-page">
      <div className="credentials-header">
        <button onClick={() => onBack('home')} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <h1 className="credentials-title">Login & Security</h1>
      </div>
      <div className="credentials-container">
        <p>Please log in to view your credentials</p>
      </div>
    </div>
  );
}
  return (
    <div className="credentials-page">
      <div className="credentials-header">
        <button onClick={() => onBack('home')} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <h1 className="credentials-title">Login & Security</h1>
      </div>

      <div className="credentials-container">
        {/* Name */}
        <div className="credential-row">
          <div className="credential-info">
            <h3 className="credential-label">Name</h3>
            <p className="credential-value">{userData.name}</p>
          </div>
          <button className="edit-button" onClick={() => handleEdit('name')}>
            Edit
          </button>
        </div>

        {/* Email */}
        <div className="credential-row">
          <div className="credential-info">
            <h3 className="credential-label">Email</h3>
            <p className="credential-value">{userData.email}</p>
          </div>
          <button className="edit-button" onClick={() => handleEdit('email')}>
            Edit
          </button>
        </div>

        {/* Phone */}
        <div className="credential-row">
          <div className="credential-info">
            <h3 className="credential-label">Primary mobile number</h3>
            <p className="credential-value">{userData.phone}</p>
            <p className="credential-description">
              Quickly sign in, easily recover passwords and receive security notifications with this mobile number.
            </p>
          </div>
          <button className="edit-button" onClick={() => handleEdit('phone')}>
            Edit
          </button>
        </div>

        {/* Password */}
        <div className="credential-row">
          <div className="credential-info">
            <h3 className="credential-label">Password</h3>
            <p className="credential-value">••••••••••</p>
          </div>
          <button className="edit-button" onClick={() => handleEdit('password')}>
            Edit
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              <X size={24} />
            </button>
            <h2 className="modal-title">
              Edit {editModal.field === 'name' && 'Name'}
              {editModal.field === 'email' && 'Email'}
              {editModal.field === 'phone' && 'Phone Number'}
              {editModal.field === 'password' && 'Password'}
            </h2>

            {renderModalContent()}

            <button className="modal-save-button" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="success-notification">
          <p>{successMessage}</p>
        </div>
      )}
    </div>
  );
}

export default AccountCredentialsPage;
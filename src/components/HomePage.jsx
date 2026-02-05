import React, { useState, useEffect } from 'react';
import { Store, ClipboardList, Sparkles, DollarSign, Clock, Instagram } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

function HomePage({ shouldFadeIn }) {
  const [show, setShow] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const { user } = useAuth();
  const [showReloadHint, setShowReloadHint] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    amount: ''
  });

  //Handle the scroll hint timing - only show once ever
  useEffect(() => {
    // Check if user has already seen the hint
    const hasSeenHint = localStorage.getItem('hasSeenScrollHint');
    
    if (hasSeenHint) {
      return; // Don't show if already seen
    }

    // 1. Initial 1 second delay before appearing
    const showTimer = setTimeout(() => {
      setShowScrollHint(true);
    }, 1000); 

    // 2. Hide after 6 seconds total (1s delay + 5s visibility)
    const hideTimer = setTimeout(() => {
      setShowScrollHint(false);
      localStorage.setItem('hasSeenScrollHint', 'true'); // Mark as seen
    }, 6000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  //Wait 3 secondes of loading before asking to reload the page
  useEffect(() => {
    let timer;

    if (storesLoading) {
      timer = setTimeout(() => {
        setShowReloadHint(true);
      }, 3000);
    } else {
      setShowReloadHint(false);
    }

    return () => clearTimeout(timer);
  }, [storesLoading]);

  // Triggers the fade-in class right after the component mounts
  useEffect(() => {
    if (shouldFadeIn) {
      // Use a slight delay to ensure CSS transition is registered
      const timer = setTimeout(() => {
        setShow(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [shouldFadeIn]);

  // Fetch stores from Supabase
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Transform data to match expected format
        const formattedStores = data.map(store => ({
          id: store.id,
          name: store.name,
          timeframe: store.timeframe,
          restrictions: [
            store.restriction_1,
            store.restriction_2,
            store.restriction_3
          ].filter(Boolean), // Remove null/empty restrictions
          logo: store.logo_url
        }));

        setStores(formattedStores);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setStoresLoading(false);
      }
    };

    fetchStores();
  }, []);


  const steps = [
    {
      id: 1,
      icon: Store,
      title: 'Order from an available store',
      description: <>Don't forget to <strong>create a store account</strong> and follow the restrictions.</>
    },
    {
      id: 2,
      icon: ClipboardList,
      title: 'When the order arrives, fill our quick form',
      description: 'Click the box of the store you ordered from to open the form, then enter the correct information about your order.'
    },
    {
      id: 3,
      icon: Sparkles,
      title: 'We work on our end to get you a refund',
      description: 'We use loopholes to process your refund. This ensures a discreet and fully legal process for both you and us.'
    },
    {
      id: 4,
      icon: DollarSign,
      title: 'Receive your refund and submit your payment',
      description: 'Depending on your store’s timeframe, you will receive your refund. We will then send you an invoice for our portion of the deal!'
    }
  ];

  const handleStoreClick = (storeId) => {
    setSelectedStore(storeId);
  };

  const handleYes = () => {
    setShowPopup(true);
  };

  const handleNo = () => {
    setSelectedStore(null);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setFormData({
      email: '',
      password: '',
      phone: '',
      amount: ''
    });
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

  const handleInputChange = (e) => {
      const { name, value } = e.target;

      if (name === 'phone') {
        // Format phone number
        const formattedPhone = formatPhoneNumber(value);
        setFormData(prev => ({
          ...prev,
          [name]: formattedPhone
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
  };

  const handleSubmit = async (e) => {
      e.preventDefault(); // Empêche la page de se rafraîchir

      const selectedStoreData = stores.find(s => s.id === selectedStore);
      const storeName = selectedStoreData ? selectedStoreData.name : '';
      // Ici, je concatène l'adresse pour qu'elle soit plus facile à lire dans ta table
      const fullAddress = `${formData.street}, ${formData.city}, ${formData.province}, ${formData.postalCode}, ${formData.country}`;

      try {
        // Get referral code from sessionStorage
        const referralCode = sessionStorage.getItem('referralCode') || null;

        // 1. Insert the order
        const { data, error } = await supabase
          .from('Orders_information')
          .insert([
            {
              store_account_email: formData.email,
              store_account_password: formData.password,
              phone: formData.phone,
              order_amount: parseFloat(formData.amount),
              store_name: storeName,
              user_id: user?.id || null,
              referral_code: referralCode,
            }
          ]);

        if (error) throw error;

        // 3. Success: hide form and show success message
        setShowPopup(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

        setFormData({
          email: '', password: '', phone: '', amount: ''
        });

      } catch (error) {
        console.error("Erreur détaillée:", error);
        alert("Erreur lors de l'enregistrement : " + error.message);
      }
    };

  return (
    <div className={`homepage ${show ? 'fade-in' : 'fade-out'}`}>
      {/* Login Button - Only show if user is not logged in */}

      <div className="homepage-container">

        {/* Available Stores Section */}
        <section className="stores-section">
          <div className="section-header">
            <h1 className="section-title">Available Stores</h1>
            <p className="section-description">
              Order from any of these stores respecting the restrictions and benefit from our service to receive cashbacks.
            </p>
          </div>

          <div className="stores-grid">
            {storesLoading ? (
              <div className="stores-loading">
                <div className="spinner"></div>
                <p>
                  Loading stores…
                  {showReloadHint && <span> Reload the page if slow.</span>}
                </p>
              </div>
            ) : stores.length === 0 ? (
              <p>No stores available</p>
            ) : (
              stores.map((store) => (
                <div
                  key={store.id}
                  className="store-box"
                  onClick={() => handleStoreClick(store.id)}
                >
                  {selectedStore === store.id ? (
                    <div className="store-question-container">
                      <p className="store-question">Did you create a {store.name} account?</p>
                      <div className="store-buttons">
                        <button
                          className="store-btn store-btn-yes"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleYes();
                          }}
                        >
                          Yes
                        </button>
                        <button
                          className="store-btn store-btn-no"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNo();
                          }}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="store-header">
                        <div className="store-logo-placeholder">
                          {store.logo ? (
                            <img src={store.logo} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            'Logo'
                          )}
                        </div>
                        <div className="store-name">{store.name}</div>
                        <div className="discount-badge">50% OFF</div>
                      </div>
                      <ul className="store-restriction">
                        {store.restrictions.map((restriction, index) => (
                          <li key={index}>{restriction}</li>
                        ))}
                      </ul>
                      <div className="store-timeframe">
                        <Clock size={14} />
                        <span>Timeframe: {store.timeframe}</span>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>  
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="section-header">
            <h2 className="section-title">How Does It Work</h2>
          </div>

          <div className="steps-container">
            <div className="step-connector"></div>

            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="step-card">
                  <div className="step-number">{step.id}</div>
                  <div className="step-icon-wrapper">
                    <IconComponent className="step-icon" />
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              );
            })}
          </div>

          {/* Pro Tip - Outside steps-container to ensure it's always below */}
          <div className="bonus-step-container" style={{ 
            width: '100%',
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '3rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '600px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ 
                fontSize: '1.1rem', 
                marginBottom: '0.5rem', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px' 
              }}>
                <Sparkles size={18} className="text-yellow-400" />
                Pro Tip: Register First
              </h4>
              <p style={{ fontSize: '0.95rem', opacity: 0.8, lineHeight: '1.5', margin: 0 }}>
                We strongly advise you to register on our website before placing an order. 
                This way, you will be able to track it.
              </p>
            </div>
          </div>
        </section>
        {/* Reach Us Section */}
        <section className="reach-us-section" style={{ marginTop: '4rem', paddingBottom: '3rem', textAlign: 'center' }}>
          <div className="section-header">
            <h2 className="section-title">Reach Us</h2>
            <p className="section-description">
              Check out our latest updates and proofs on social media.
            </p>
          </div>

          <div className="social-links" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
            {/* Instagram Link */}
            <a 
              href="https://instagram.com/shop_buster50" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
            >
              <Instagram size={24} />
              <span>Instagram</span>
            </a>

            {/* TikTok Link */}
            <a 
              href="https://tiktok.com/@shop_buster50" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
            >
              {/* Lucide doesn't have a TikTok icon, so we use a stylized SVG or text */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span>TikTok</span>
            </a>
          </div>
        </section>
      </div>

      {/* Popup Form */}
      {showPopup && (() => {
        const selectedStoreData = stores.find(s => s.id === selectedStore);
        return (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-form" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={handleClosePopup}>×</button>
            <h2 className="popup-title">Order Information</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <p className="form-section-title">{selectedStoreData?.name} Account Credentials</p>
                <div className="form-row">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-section">
                <h3 className="form-section-title">Order Details</h3>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="form-input full-width"
                />
                <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    placeholder="Order Amount (ex: 500$)"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    className="form-input full-width"
                  />
                </div>
              </div>

              <button type="submit" className="form-submit">Submit</button>
            </form>
          </div>
        </div>
      );
    })()}

      {/* Success Message */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-message-box">
            <div className="success-icon">✓</div>
            <p className="success-text">Order received, we are working on it!</p>
          </div>
        </div>
      )}
      {/* Scroll Hint Popup */}
      {showScrollHint && (
        <div style={{
          position: 'fixed',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#000',
          color: '#fff',
          padding: '20px 40px',
          borderRadius: '50px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontSize: '20px',
          fontWeight: '600',
          pointerEvents: 'none', // Allows clicking through it
          whiteSpace: 'nowrap',
          transition: 'opacity 1s ease, transform 1s ease',
          opacity: showScrollHint ? 1 : 0,
        }}>
          Scroll down to see how it works! ↓
        </div>
      )}
    </div>
  );
}

export default HomePage;
import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const Checkout = ({ onBack }) => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [orderMethod, setOrderMethod] = useState('whatsapp');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const userId = 'user_' + Date.now(); // Simple user ID generation
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Load saved addresses
    const storedUserId = localStorage.getItem('thulasibloom_user_id') || userId;
    localStorage.setItem('thulasibloom_user_id', storedUserId);
    
    fetch(`http://localhost:5000/api/addresses/${storedUserId}`)
      .then(res => res.json())
      .then(addresses => setSavedAddresses(addresses))
      .catch(err => console.error('Failed to load addresses:', err));
  }, []);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    notes: ''
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    });
  };

  const saveAddress = async () => {
    const errors = {};
    if (!customerInfo.name.trim()) errors.name = 'Name is required';
    if (!customerInfo.phone.trim()) errors.phone = 'Phone is required';
    else if (customerInfo.phone.length < 10) errors.phone = 'Enter valid phone number';
    if (!customerInfo.addressLine1.trim()) errors.addressLine1 = 'Address is required';
    if (!customerInfo.city.trim()) errors.city = 'City is required';
    if (!customerInfo.state.trim()) errors.state = 'State is required';
    if (!customerInfo.pincode.trim()) errors.pincode = 'Pincode is required';
    else if (customerInfo.pincode.length !== 6) errors.pincode = 'Enter valid 6-digit pincode';
    
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    const storedUserId = localStorage.getItem('thulasibloom_user_id');
    const addressData = {
      userId: storedUserId,
      name: customerInfo.name,
      phone: customerInfo.phone,
      addressLine1: customerInfo.addressLine1,
      addressLine2: customerInfo.addressLine2,
      city: customerInfo.city,
      state: customerInfo.state,
      pincode: customerInfo.pincode,
      landmark: customerInfo.landmark
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      
      if (response.ok) {
        const result = await response.json();
        const newAddress = { ...addressData, id: result.id };
        setSavedAddresses([...savedAddresses, newAddress]);
        setSelectedAddressId(newAddress.id);
        setShowAddressForm(false);
        
        // Clear address form but keep name and phone
        setCustomerInfo({
          ...customerInfo,
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        });
      } else {
        alert('Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (orderMethod === 'email' && !customerInfo.email.trim()) {
      errors.email = 'Email is required for email orders';
    } else if (orderMethod === 'email' && !customerInfo.email.includes('@')) {
      errors.email = 'Enter valid email address';
    }
    
    if (user) {
      // Logged in user - check if address is selected
      if (!selectedAddressId) {
        errors.deliveryAddress = 'Please select or add a delivery address';
      }
    } else {
      // Guest user - validate address fields
      if (!customerInfo.name.trim()) errors.name = 'Name is required';
      if (!customerInfo.phone.trim()) errors.phone = 'Phone is required';
      else if (customerInfo.phone.length < 10) errors.phone = 'Enter valid phone number';
      if (!customerInfo.addressLine1.trim()) errors.addressLine1 = 'Address is required';
      if (!customerInfo.city.trim()) errors.city = 'City is required';
      if (!customerInfo.state.trim()) errors.state = 'State is required';
      if (!customerInfo.pincode.trim()) errors.pincode = 'Pincode is required';
      else if (customerInfo.pincode.length !== 6) errors.pincode = 'Enter valid 6-digit pincode';
    }
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getSelectedAddress = () => {
    if (user) {
      if (selectedAddressId) {
        return savedAddresses.find(addr => addr.id === selectedAddressId);
      }
      return showAddressForm ? customerInfo : null;
    } else {
      // Guest user - return current form data
      return customerInfo;
    }
  };

  const formatOrderMessage = () => {
    const orderDetails = cart.map(item => 
      `• ${item.name} (${item.weight}) - ₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}`
    ).join('\n');

    const address = getSelectedAddress();
    const addressText = address ? 
      `${address.name}\nPhone: ${address.phone}\n${address.address_line1 || address.addressLine1}${(address.address_line2 || address.addressLine2) ? ', ' + (address.address_line2 || address.addressLine2) : ''}\n${address.city}, ${address.state} - ${address.pincode}${address.landmark ? '\nLandmark: ' + address.landmark : ''}` :
      'Address not provided';

    return `🛒 *New Order from ThulasiBloom*

📍 *Delivery Address:*
${addressText}
${customerInfo.email ? `\nEmail: ${customerInfo.email}` : ''}

📦 *Order Details:*
${orderDetails}

💰 *Total Amount: ₹${getCartTotal()}*

${customerInfo.notes ? `📝 *Notes:* ${customerInfo.notes}` : ''}

Thank you for choosing ThulasiBloom! 🌿`;
  };

  const handleWhatsAppOrder = () => {
    const message = formatOrderMessage();
    const whatsappNumber = '916384726384'; // Replace with your WhatsApp number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setOrderSuccess(true);
    clearCart();
  };

  const handleEmailOrder = async () => {
    const address = getSelectedAddress();
    const orderData = {
      customer: {
        name: address?.name || 'N/A',
        phone: address?.phone || 'N/A',
        email: customerInfo.email || 'N/A'
      },
      items: cart,
      total: getCartTotal(),
      orderDate: new Date().toISOString(),
      message: formatOrderMessage()
    };

    try {
      // Replace with your email service endpoint
      const response = await fetch('http://localhost:5000/api/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        setOrderSuccess(true);
        clearCart();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Email order error:', error);
      alert('Failed to send order via email. Please try WhatsApp instead.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (orderMethod === 'whatsapp') {
        handleWhatsAppOrder();
      } else {
        await handleEmailOrder();
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="order-success">
        <div className="floating-elements">
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
        </div>
        
        <div className="success-card">
          <div className="success-animation">
            <div className="success-circle">
              <div className="success-checkmark">✓</div>
            </div>
            <div className="success-particles">
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </div>
          </div>
          
          <h2>Order Submitted Successfully!</h2>
          <p>
            {orderMethod === 'whatsapp' 
              ? 'Your order has been sent via WhatsApp. We will contact you shortly to confirm your order.'
              : 'Your order has been sent via email. We will contact you shortly to confirm your order.'
            }
          </p>
          <button onClick={onBack} className="back-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h2>Complete Your Order</h2>
        
        <div className="order-method-selection">
          <h3>Choose Order Method</h3>
          <div className="order-method-options">

            <label className={`method-option ${orderMethod === 'whatsapp' ? 'active' : ''}`}>
              <input
                type="radio"
                name="orderMethod"
                value="whatsapp"
                checked={orderMethod === 'whatsapp'}
                onChange={(e) => setOrderMethod(e.target.value)}
              />
              <div className="method-content">
                <i className="fab fa-whatsapp"></i>
                <span>WhatsApp Order</span>
                <small>Quick and easy via WhatsApp</small>
              </div>
            </label>
            
            <label className={`method-option ${orderMethod === 'email' ? 'active' : ''}`}>
              <input
                type="radio"
                name="orderMethod"
                value="email"
                checked={orderMethod === 'email'}
                onChange={(e) => setOrderMethod(e.target.value)}
              />
              <div className="method-content">
                <i className="fas fa-envelope"></i>
                <span>Email Order</span>
                <small>Send order details via email</small>
              </div>
            </label>
          </div>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} className="checkout-item">
              <span>{item.name} ({item.weight}) × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="checkout-total">
            <strong>Total: ₹{getCartTotal()}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          {orderMethod === 'email' && (
            <div className="form-section">
              <h3>Email Information</h3>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className={addressErrors.email ? 'error' : ''}
                  required
                />
                {addressErrors.email && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {addressErrors.email}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Delivery Address</h3>
            
            {user ? (
              // Logged in user - show dropdown with saved addresses
              <div className="address-section-compact">
                <div ref={dropdownRef} className="custom-dropdown" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <div className="dropdown-selected">
                      {selectedAddressId ? (
                        <div className="selected-address">
                          <div className="address-name">{savedAddresses.find(a => a.id === selectedAddressId)?.name}</div>
                          <div className="address-details">{savedAddresses.find(a => a.id === selectedAddressId)?.address_line1}</div>
                          <div className="address-location">{savedAddresses.find(a => a.id === selectedAddressId)?.city}, {savedAddresses.find(a => a.id === selectedAddressId)?.state}</div>
                        </div>
                      ) : (
                        <span style={{color: '#999'}}>Select delivery address</span>
                      )}
                      <i className="fas fa-chevron-down"></i>
                    </div>
                    {addressErrors.deliveryAddress && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {addressErrors.deliveryAddress}
                      </div>
                    )}
                    {isDropdownOpen && (
                      <div className="dropdown-options">
                        <div className="dropdown-scroll">
                          {savedAddresses.map(address => (
                            <div 
                              key={address.id} 
                              className={`dropdown-option ${selectedAddressId === address.id ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAddressId(address.id);
                                setIsDropdownOpen(false);
                                setShowAddressForm(false);
                                if (addressErrors.deliveryAddress) {
                                  setAddressErrors({...addressErrors, deliveryAddress: ''});
                                }
                              }}
                            >
                              <div className="option-name">{address.name}</div>
                              <div className="option-address">{address.address_line1}</div>
                              <div className="option-location">{address.city}, {address.state} - {address.pincode}</div>
                              {address.landmark && <div className="option-landmark">{address.landmark}</div>}
                            </div>
                          ))}
                        </div>
                        
                        <div 
                          className="dropdown-option sticky-add-option"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAddressForm(true);
                            setSelectedAddressId(null);
                            setIsDropdownOpen(false);
                          }}
                        >
                          Add New Address
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {showAddressForm && (
                    <div className="whatsapp-address-form">
                      <div className="form-header">
                        <h4 className="form-title">Add New Address</h4>
                        <button 
                          type="button" 
                          className="close-form-btn"
                          onClick={() => setShowAddressForm(false)}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="form-group floating-label">
                        <input
                          type="text"
                          name="name"
                          value={customerInfo.name}
                          onChange={(e) => {
                            handleInputChange(e);
                            if (addressErrors.name) {
                              setAddressErrors({...addressErrors, name: ''});
                            }
                          }}
                          placeholder="Full Name *"
                          className={addressErrors.name ? 'error' : ''}
                          id="addressName"
                        />
                        <label htmlFor="addressName">Full Name *</label>
                        {addressErrors.name && (
                          <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {addressErrors.name}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group floating-label">
                        <input
                          type="tel"
                          name="phone"
                          value={customerInfo.phone}
                          onChange={(e) => {
                            handleInputChange(e);
                            if (addressErrors.phone) {
                              setAddressErrors({...addressErrors, phone: ''});
                            }
                          }}
                          placeholder="Phone Number *"
                          className={addressErrors.phone ? 'error' : ''}
                          id="addressPhone"
                        />
                        <label htmlFor="addressPhone">Phone Number *</label>
                        {addressErrors.phone && (
                          <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {addressErrors.phone}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group floating-label">
                        <input
                          type="text"
                          name="addressLine1"
                          value={customerInfo.addressLine1}
                          onChange={(e) => {
                            handleInputChange(e);
                            if (addressErrors.addressLine1) {
                              setAddressErrors({...addressErrors, addressLine1: ''});
                            }
                          }}
                          placeholder="House/Flat No, Building Name *"
                          className={addressErrors.addressLine1 ? 'error' : ''}
                          id="addressLine1"
                        />
                        <label htmlFor="addressLine1">House/Flat No, Building Name *</label>
                        {addressErrors.addressLine1 && (
                          <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {addressErrors.addressLine1}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group floating-label">
                        <input
                          type="text"
                          name="addressLine2"
                          value={customerInfo.addressLine2}
                          onChange={handleInputChange}
                          placeholder="Street, Area, Locality"
                          id="addressLine2"
                        />
                        <label htmlFor="addressLine2">Street, Area, Locality</label>
                      </div>
                      
                      <div className="form-group floating-label">
                        <input
                          type="text"
                          name="city"
                          value={customerInfo.city}
                          onChange={(e) => {
                            handleInputChange(e);
                            if (addressErrors.city) {
                              setAddressErrors({...addressErrors, city: ''});
                            }
                          }}
                          placeholder="City *"
                          className={addressErrors.city ? 'error' : ''}
                          id="city"
                        />
                        <label htmlFor="city">City *</label>
                        {addressErrors.city && (
                          <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {addressErrors.city}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group floating-label">
                        <select
                          name="state"
                          value={customerInfo.state}
                          onChange={(e) => {
                            handleInputChange(e);
                            if (addressErrors.state) {
                              setAddressErrors({...addressErrors, state: ''});
                            }
                          }}
                          className={addressErrors.state ? 'error' : ''}
                          id="state"
                        >
                          <option value=""></option>
                          {indianStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                        <label htmlFor="state">State *</label>
                        {addressErrors.state && (
                          <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {addressErrors.state}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group floating-label">
                        <input
                          type="text"
                          name="pincode"
                          value={customerInfo.pincode}
                          onChange={(e) => {
                            handleInputChange(e);
                            if (addressErrors.pincode) {
                              setAddressErrors({...addressErrors, pincode: ''});
                            }
                          }}
                          placeholder="Pincode *"
                          maxLength="6"
                          className={addressErrors.pincode ? 'error' : ''}
                          id="pincode"
                        />
                        <label htmlFor="pincode">Pincode *</label>
                        {addressErrors.pincode && (
                          <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {addressErrors.pincode}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group floating-label">
                        <input
                          type="text"
                          name="landmark"
                          value={customerInfo.landmark}
                          onChange={handleInputChange}
                          placeholder="Landmark (Optional)"
                          id="landmark"
                        />
                        <label htmlFor="landmark">Landmark (Optional)</label>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={saveAddress}
                        className="save-address-btn"
                      >
                        Save Address
                      </button>
                    </div>
                  )}
                </div>
            ) : (
              // Guest user - show address fields directly
              <div className="guest-address-form">
                <div className="form-group floating-label">
                  <input
                    type="text"
                    name="name"
                    value={customerInfo.name}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (addressErrors.name) {
                        setAddressErrors({...addressErrors, name: ''});
                      }
                    }}
                    placeholder="Full Name *"
                    className={addressErrors.name ? 'error' : ''}
                    id="guestName"
                  />
                  <label htmlFor="guestName">Full Name *</label>
                  {addressErrors.name && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {addressErrors.name}
                    </div>
                  )}
                </div>
                
                <div className="form-group floating-label">
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (addressErrors.phone) {
                        setAddressErrors({...addressErrors, phone: ''});
                      }
                    }}
                    placeholder="Phone Number *"
                    className={addressErrors.phone ? 'error' : ''}
                    id="guestPhone"
                  />
                  <label htmlFor="guestPhone">Phone Number *</label>
                  {addressErrors.phone && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {addressErrors.phone}
                    </div>
                  )}
                </div>
                
                <div className="form-group floating-label">
                  <input
                    type="text"
                    name="addressLine1"
                    value={customerInfo.addressLine1}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (addressErrors.addressLine1) {
                        setAddressErrors({...addressErrors, addressLine1: ''});
                      }
                    }}
                    placeholder="House/Flat No, Building Name *"
                    className={addressErrors.addressLine1 ? 'error' : ''}
                    id="guestAddressLine1"
                  />
                  <label htmlFor="guestAddressLine1">House/Flat No, Building Name *</label>
                  {addressErrors.addressLine1 && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {addressErrors.addressLine1}
                    </div>
                  )}
                </div>
                
                <div className="form-group floating-label">
                  <input
                    type="text"
                    name="addressLine2"
                    value={customerInfo.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Street, Area, Locality"
                    id="guestAddressLine2"
                  />
                  <label htmlFor="guestAddressLine2">Street, Area, Locality</label>
                </div>
                
                <div className="form-group floating-label">
                  <input
                    type="text"
                    name="city"
                    value={customerInfo.city}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (addressErrors.city) {
                        setAddressErrors({...addressErrors, city: ''});
                      }
                    }}
                    placeholder="City *"
                    className={addressErrors.city ? 'error' : ''}
                    id="guestCity"
                  />
                  <label htmlFor="guestCity">City *</label>
                  {addressErrors.city && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {addressErrors.city}
                    </div>
                  )}
                </div>
                
                <div className="form-group floating-label">
                  <select
                    name="state"
                    value={customerInfo.state}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (addressErrors.state) {
                        setAddressErrors({...addressErrors, state: ''});
                      }
                    }}
                    className={addressErrors.state ? 'error' : ''}
                    id="guestState"
                  >
                    <option value=""></option>
                    {indianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <label htmlFor="guestState">State *</label>
                  {addressErrors.state && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {addressErrors.state}
                    </div>
                  )}
                </div>
                
                <div className="form-group floating-label">
                  <input
                    type="text"
                    name="pincode"
                    value={customerInfo.pincode}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (addressErrors.pincode) {
                        setAddressErrors({...addressErrors, pincode: ''});
                      }
                    }}
                    placeholder="Pincode *"
                    maxLength="6"
                    className={addressErrors.pincode ? 'error' : ''}
                    id="guestPincode"
                  />
                  <label htmlFor="guestPincode">Pincode *</label>
                  {addressErrors.pincode && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {addressErrors.pincode}
                    </div>
                  )}
                </div>
                
                <div className="form-group floating-label">
                  <input
                    type="text"
                    name="landmark"
                    value={customerInfo.landmark}
                    onChange={handleInputChange}
                    placeholder="Landmark (Optional)"
                    id="guestLandmark"
                  />
                  <label htmlFor="guestLandmark">Landmark (Optional)</label>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Special Instructions (Optional)</label>
              <textarea
                name="notes"
                value={customerInfo.notes}
                onChange={handleInputChange}
                placeholder="Any special instructions for delivery..."
                rows="2"
              />
            </div>
          </div>

          <div className="delivery-info">
            <i className="fas fa-truck"></i>
            <span>Free delivery within city limits. Delivery charges may apply for outstation orders.</span>
          </div>

          <div className="checkout-actions">
            <button type="button" onClick={onBack} className="back-btn">
              Back to Cart
            </button>
            <button type="submit" disabled={isSubmitting} className="place-order-btn">
              {isSubmitting ? 'Processing...' : 
               orderMethod === 'whatsapp' ? 'Send WhatsApp Order' : 'Send Email Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
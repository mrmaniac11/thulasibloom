import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { encryptData } from '../utils/encryption';
import { indianStates } from '../data/indianStates';
import Login from './Login';

const Checkout = ({ isOpen, onClose, onBack }) => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [orderMethod, setOrderMethod] = useState(user ? 'online' : 'online'); // 'online', 'cod', 'whatsapp'
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressErrors, setAddressErrors] = useState({});

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://thulasibloom-backend.onrender.com/api'
    : 'http://localhost:5000/api';

  // Load saved addresses for logged users
  useEffect(() => {
    if (user) {
      const savedAddresses = JSON.parse(localStorage.getItem(`addresses_${user.id}`) || '[]');
      setAddresses(savedAddresses);
      if (savedAddresses.length > 0) {
        setSelectedAddress(savedAddresses[0]);
      }
    }
  }, [user]);

  const validateAddress = () => {
    const errors = {};
    
    if (!customerInfo.addressLine1.trim()) {
      errors.addressLine1 = 'Address Line 1 is required';
    }
    
    if (!customerInfo.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!customerInfo.state) {
      errors.state = 'Please select a state';
    }
    
    if (!customerInfo.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(customerInfo.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }
    
    return errors;
  };

  const saveAddress = async () => {
    // Client validation first
    const clientErrors = validateAddress();
    setAddressErrors(clientErrors);
    
    if (Object.keys(clientErrors).length > 0) {
      return;
    }
    
    const addressData = {
      addressLine1: customerInfo.addressLine1,
      addressLine2: customerInfo.addressLine2,
      city: customerInfo.city,
      state: customerInfo.state,
      pincode: customerInfo.pincode,
      landmark: customerInfo.landmark
    };
    
    try {
      const response = await fetch(`${API_BASE}/validate-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        setAddressErrors(result.errors);
        return;
      }
      
      const newAddress = {
        id: Date.now(),
        name: customerInfo.name,
        ...addressData
      };
      const updatedAddresses = [...addresses, newAddress];
      setAddresses(updatedAddresses);
      localStorage.setItem(`addresses_${user.id}`, JSON.stringify(updatedAddresses));
      setSelectedAddress(newAddress);
      setShowAddressForm(false);
      setAddressErrors({});
    } catch (error) {
      console.error('Server validation failed:', error);
    }
  };

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = async () => {
    if (paymentMethod === 'online') {
      console.log('Initiating Razorpay payment for amount:', getCartTotal());
      
      if (!window.Razorpay) {
        alert('Razorpay SDK not loaded. Please refresh the page.');
        return;
      }
      
      const options = {
        key: 'rzp_test_1234567890', // Replace with your actual test key
        amount: getCartTotal() * 100,
        currency: 'INR',
        name: 'ThulasiBloom',
        description: 'Premium Health Mix',
        handler: function (response) {
          console.log('Payment successful:', response.razorpay_payment_id);
          placeOrder(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        theme: {
          color: '#2c5530'
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.log('Payment failed:', response.error);
        alert('Payment failed: ' + response.error.description);
        setIsSubmitting(false);
      });
      
      rzp.open();
    } else {
      placeOrder();
    }
  };

  const placeOrder = async (paymentId = null) => {
    try {
      const encryptedCustomer = {
        name: customerInfo.name,
        email: encryptData(customerInfo.email),
        phone: encryptData(customerInfo.phone),
        address: encryptData(customerInfo.address)
      };
      
      const API_BASE = process.env.NODE_ENV === 'production' 
        ? 'https://thulasibloom-backend.onrender.com/api'
        : 'http://localhost:5000/api';
        
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: encryptedCustomer,
          items: cart,
          total: getCartTotal(),
          paymentMethod,
          paymentId
        })
      });

      if (response.ok) {
        setOrderPlaced(true);
        clearCart();
        setTimeout(() => {
          setOrderPlaced(false);
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  const sendWhatsAppOrder = () => {
    const address = user && selectedAddress ? selectedAddress : customerInfo;
    const customerName = user ? user.name : customerInfo.name;
    const customerPhone = user ? user.phone : customerInfo.phone;
    const customerEmail = user ? user.email : customerInfo.email;
    
    const orderDetails = `*ThulasiBloom Order Request*\n\n` +
      `*Customer Details:*\n` +
      `Name: ${customerName}\n` +
      `Phone: ${customerPhone}\n` +
      `Email: ${customerEmail}\n\n` +
      `*Delivery Address:*\n` +
      `${address.addressLine1}\n` +
      `${address.addressLine2}\n` +
      `${address.city}, ${address.state}\n` +
      `Pincode: ${address.pincode}\n` +
      `Landmark: ${address.landmark}\n\n` +
      `*Order Items:*\n` +
      cart.map(item => `${item.name} (${item.weight}) x ${item.quantity} = ₹${item.price * item.quantity}`).join('\n') +
      `\n\n*Total Amount: ₹${getCartTotal()}*\n` +
      `*Payment Method: ${orderMethod === 'online' ? 'Online Payment' : 'WhatsApp Order'}*\n\n` +
      `*Delivery: By Courier*\n\n` +
      `Please confirm this order. Thank you!`;
    
    const whatsappUrl = `https://wa.me/916384726384?text=${encodeURIComponent(orderDetails)}`;
    window.open(whatsappUrl, '_blank');
    
    setOrderPlaced(true);
    clearCart();
    setTimeout(() => {
      setOrderPlaced(false);
      onClose();
    }, 3000);
  };

  const sendEmailOrder = async () => {
    const orderDetails = {
      customer: customerInfo,
      items: cart,
      total: getCartTotal(),
      paymentMethod,
      orderDate: new Date().toISOString()
    };
    
    try {
      const response = await fetch(`${API_BASE}/send-order-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails)
      });
      
      if (response.ok) {
        setOrderPlaced(true);
        clearCart();
        setTimeout(() => {
          setOrderPlaced(false);
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      // Fallback to WhatsApp
      sendWhatsAppOrder();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (orderMethod === 'whatsapp') {
      if (user && !selectedAddress && addresses.length > 0) {
        alert('Please select a delivery address');
        setIsSubmitting(false);
        return;
      }
      sendWhatsAppOrder();
    } else {
      // Online payment
      await handlePayment();
    }
    
    setIsSubmitting(false);
  };

  if (orderPlaced) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="order-success">
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your order. We'll contact you soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content checkout-modal">
        <div className="modal-header">
          <h3>Checkout</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="checkout-summary">
            <h4>Order Summary</h4>
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
          
          <div className="checkout-tabs">
            <div className="tab-buttons">
              <button 
                type="button"
                className={`tab-btn ${orderMethod === 'online' ? 'active' : ''}`}
                onClick={() => setOrderMethod('online')}
              >
                <i className="fas fa-credit-card"></i>
                {user ? 'Online Payment' : 'Login & Order'}
              </button>
              <button 
                type="button"
                className={`tab-btn ${orderMethod === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setOrderMethod('whatsapp')}
              >
                <i className="fab fa-whatsapp"></i>
                Order via WhatsApp
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="checkout-form">

            
            {(!user && orderMethod === 'online') ? (
              <div className="login-prompt">
                <p>Please login to continue with secure checkout</p>
                <button type="button" onClick={() => setShowLogin(true)} className="login-prompt-btn">
                  Login / Sign Up
                </button>
              </div>
            ) : (
              <>
                {user && (
                  <div className="address-section-compact">
                    {addresses.length > 0 ? (
                      <div className="address-row">
                        <select 
                          value={selectedAddress?.id || ''} 
                          onChange={(e) => {
                            const addr = addresses.find(a => a.id == e.target.value);
                            setSelectedAddress(addr);
                          }}
                        >
                          {addresses.map(addr => (
                            <option key={addr.id} value={addr.id}>
                              {addr.addressLine1}, {addr.city}
                            </option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (!showAddressForm) {
                              setCustomerInfo({
                                ...customerInfo,
                                addressLine1: '',
                                addressLine2: '',
                                city: '',
                                state: '',
                                pincode: '',
                                landmark: ''
                              });
                            }
                            setShowAddressForm(!showAddressForm);
                          }}
                          className="add-btn-small"
                        >
                          <i className={`fas ${showAddressForm ? 'fa-times' : 'fa-plus'}`}></i>
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomerInfo({
                            ...customerInfo,
                            addressLine1: '',
                            addressLine2: '',
                            city: '',
                            state: '',
                            pincode: '',
                            landmark: ''
                          });
                          setShowAddressForm(true);
                        }}
                        className="add-address-btn-compact"
                      >
                        <i className="fas fa-plus"></i> Add Delivery Address
                      </button>
                    )}
                  </div>
                )}
                
                {((user && showAddressForm && orderMethod !== 'whatsapp') || (!user && orderMethod !== 'whatsapp')) && (
                  <>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={customerInfo.addressLine1}
                    onChange={handleInputChange}
                    placeholder="House/Flat No, Building Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={customerInfo.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Street, Area, Locality"
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={customerInfo.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <select
                    name="state"
                    value={customerInfo.state}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select State</option>
                    {indianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={customerInfo.pincode}
                    onChange={handleInputChange}
                    pattern="[0-9]{6}"
                    maxLength="6"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={customerInfo.landmark}
                    onChange={handleInputChange}
                    placeholder="Near..."
                  />
                </div>
                  </>
                )}
                
                {user && orderMethod === 'whatsapp' && showAddressForm && (
                  <div className="whatsapp-address-form">
                    <h5 className="form-title">Add Your New Address</h5>
                    <div className="form-group">
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
                        placeholder="Address Line 1 *"
                        className={addressErrors.addressLine1 ? 'error' : ''}
                      />
                      {addressErrors.addressLine1 && (
                        <div className="error-message">
                          <i className="fas fa-exclamation-circle"></i>
                          {addressErrors.addressLine1}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="addressLine2"
                        value={customerInfo.addressLine2}
                        onChange={handleInputChange}
                        placeholder="Address Line 2"
                      />
                    </div>
                    <div className="form-group">
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
                      />
                      {addressErrors.city && (
                        <div className="error-message">
                          <i className="fas fa-exclamation-circle"></i>
                          {addressErrors.city}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
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
                      >
                        <option value="">Select State *</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {addressErrors.state && (
                        <div className="error-message">
                          <i className="fas fa-exclamation-circle"></i>
                          {addressErrors.state}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
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
                      />
                      {addressErrors.pincode && (
                        <div className="error-message">
                          <i className="fas fa-exclamation-circle"></i>
                          {addressErrors.pincode}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="landmark"
                        value={customerInfo.landmark}
                        onChange={handleInputChange}
                        placeholder="Landmark"
                      />
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
                
                {user && showAddressForm && orderMethod === 'online' && (
                  <div className="whatsapp-address-form">
                    <h5 className="form-title">Add Your New Address</h5>
                    <div className="form-group">
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
                        placeholder="Address Line 1 *"
                        className={addressErrors.addressLine1 ? 'error' : ''}
                      />
                      {addressErrors.addressLine1 && (
                        <div className="error-message">
                          <i className="fas fa-exclamation-circle"></i>
                          {addressErrors.addressLine1}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="addressLine2"
                        value={customerInfo.addressLine2}
                        onChange={handleInputChange}
                        placeholder="Address Line 2"
                      />
                    </div>
                    <div className="form-group">
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
                      />
                      {addressErrors.city && (
                        <div className="error-message">
                          <i className="fas fa-exclamation-circle"></i>
                          {addressErrors.city}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
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
                      >
                        <option value="">Select State *</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {addressErrors.state && (
                        <div className="error-message">
                          <i className="fas fa-exclamation-circle"></i>
                          {addressErrors.state}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
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
                      />
                      {addressErrors.pincode && (
                        <div className="error-message">
                          <i className="fas fa-exclamation-circle"></i>
                          {addressErrors.pincode}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="landmark"
                        value={customerInfo.landmark}
                        onChange={handleInputChange}
                        placeholder="Landmark"
                      />
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
              </>
            )}
            
            <div className="delivery-info">
              <p><i className="fas fa-truck"></i> Delivery by Courier Service</p>
            </div>
            
            <div className="checkout-actions">
              <button type="button" onClick={onBack} className="back-btn">
                Back to Cart
              </button>
              {(!user && orderMethod === 'online') ? null : (
                <button type="submit" disabled={isSubmitting} className="place-order-btn">
                  {isSubmitting ? 'Processing...' : 
                   orderMethod === 'whatsapp' ? 'Send WhatsApp Order' : 
                   'Pay Online'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <Login isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
};

export default Checkout;
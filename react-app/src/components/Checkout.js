import React, { useState } from 'react';
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
  const [orderMethod, setOrderMethod] = useState('login'); // 'login' or 'whatsapp'

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://thulasibloom-backend.onrender.com/api'
    : 'http://localhost:5000/api';

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
    const orderDetails = `*ThulasiBloom Order Request*\n\n` +
      `*Customer Details:*\n` +
      `Name: ${customerInfo.name}\n` +
      `Phone: ${customerInfo.phone}\n` +
      `Email: ${customerInfo.email}\n\n` +
      `*Delivery Address:*\n` +
      `${customerInfo.addressLine1}\n` +
      `${customerInfo.addressLine2}\n` +
      `${customerInfo.city}, ${customerInfo.state}\n` +
      `Pincode: ${customerInfo.pincode}\n` +
      `Landmark: ${customerInfo.landmark}\n\n` +
      `*Order Items:*\n` +
      cart.map(item => `${item.name} (${item.weight}) x ${item.quantity} = ₹${item.price * item.quantity}`).join('\n') +
      `\n\n*Total Amount: ₹${getCartTotal()}*\n` +
      `*Payment Method: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}*\n\n` +
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
    
    if (user) {
      // Logged in user - normal checkout
      await handlePayment();
    } else {
      // Guest user - WhatsApp or email
      if (orderMethod === 'whatsapp') {
        sendWhatsAppOrder();
      } else {
        await sendEmailOrder();
      }
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

          <form onSubmit={handleSubmit} className="checkout-form">
            {!user && (
              <div className="checkout-options">
                <h4>Choose Order Method:</h4>
                <div className="order-method-options">
                  <label>
                    <input
                      type="radio"
                      name="orderMethod"
                      value="login"
                      checked={orderMethod === 'login'}
                      onChange={(e) => setOrderMethod(e.target.value)}
                    />
                    Login & Order
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="orderMethod"
                      value="whatsapp"
                      checked={orderMethod === 'whatsapp'}
                      onChange={(e) => setOrderMethod(e.target.value)}
                    />
                    Order via WhatsApp
                  </label>
                </div>
              </div>
            )}
            
            {(!user && orderMethod === 'login') ? (
              <div className="login-prompt">
                <p>Please login to continue with secure checkout</p>
                <button type="button" onClick={() => setShowLogin(true)} className="login-prompt-btn">
                  Login / Sign Up
                </button>
              </div>
            ) : (
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
                <div className="form-row">
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
                </div>
                <div className="form-row">
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
                </div>
                <div className="delivery-info">
                  <p><i className="fas fa-truck"></i> Delivery by Courier Service</p>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Payment Method *</label>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Cash on Delivery
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Online Payment
                </label>
              </div>
            </div>
            <div className="checkout-actions">
              <button type="button" onClick={onBack} className="back-btn">
                Back to Cart
              </button>
              <button type="submit" disabled={isSubmitting} className="place-order-btn">
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Login isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
};

export default Checkout;
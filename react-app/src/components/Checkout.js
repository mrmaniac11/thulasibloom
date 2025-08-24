import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { encryptData } from '../utils/encryption';

const Checkout = ({ isOpen, onClose, onBack }) => {
  const { cart, getCartTotal, clearCart } = useCart();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handlePayment();
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
              <label>Address *</label>
              <textarea
                name="address"
                value={customerInfo.address}
                onChange={handleInputChange}
                rows="3"
                required
              />
            </div>
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
    </div>
  );
};

export default Checkout;
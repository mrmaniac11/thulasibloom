import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import Checkout from './Checkout';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  const onClose = () => {
    navigate('/');
  };

  const handleProductClick = (productId) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  return (
    <div className="cart-sidebar open">
      <div className="cart-header">
        <h3>Shopping Cart</h3>
        <button className="close-cart" onClick={onClose}>&times;</button>
      </div>
      
      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button 
              className="add-products-btn"
              onClick={() => {
                onClose();
                setTimeout(() => {
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }}
            >
              Add Products
            </button>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="cart-item">
              <img 
                src={item.image || '/images/products/default.jpg'} 
                alt={item.name} 
                className="cart-item-image"
                onClick={() => handleProductClick(item.productId)}
                onError={(e) => {
                  e.target.src = '/images/products/default.jpg';
                }}
              />
              <div className="cart-item-info">
                <h4 
                  className="cart-item-name"
                  onClick={() => handleProductClick(item.productId)}
                >
                  {item.name}
                </h4>
                <p>{item.weight} × {item.quantity}</p>
              </div>
              <div className="cart-item-controls">
                {item.quantity > 1 && (
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                )}
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <div className="cart-item-price">₹{item.price * item.quantity}</div>
              <button 
                className="remove-item"
                onClick={() => removeFromCart(item.id)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
      
      {cart.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total">
            <strong>Total: ₹{getCartTotal()}</strong>
          </div>
          <button 
            className="checkout-btn"
            onClick={() => setShowCheckout(true)}
          >
            Proceed to Checkout
          </button>
        </div>
      )}
      
      {showCheckout && (
        <div className="checkout-overlay">
          <Checkout onBack={() => setShowCheckout(false)} />
        </div>
      )}
    </div>
  );
};

export default Cart;
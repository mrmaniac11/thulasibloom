import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Cart from './Cart';
import Login from './Login';

const Header = () => {
  const { getCartItemsCount } = useCart();
  const { user, logout } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isProductDetail = location.pathname.startsWith('/product/');

  const handleProductsClick = (e) => {
    e.preventDefault();
    navigate('/products');
    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      const sectionTitle = document.querySelector('.section-title');
      if (sectionTitle) {
        sectionTitle.classList.add('highlight');
        setTimeout(() => {
          sectionTitle.classList.remove('highlight');
        }, 2000);
      }
    }, 100);
  };

  return (
    <>
      <header className="header">
        <nav className="navbar">
          <Link to="/" className="nav-brand">
            <h1>ThulasiBloom</h1>
            <span>Premium Health Mix</span>
          </Link>
          <div className="nav-links">
            <button onClick={handleProductsClick} className="nav-products-btn">Products</button>
            {!user && (
              <>
                <button onClick={() => setShowLogin(true)} className="login-btn">Login</button>
                <div className="cart-icon" onClick={() => navigate('/cart')}>
                  <i className="fas fa-shopping-cart"></i>
                  <span className="cart-count">{getCartItemsCount()}</span>
                </div>
              </>
            )}
            {user && (
              <div className="hamburger-menu">
                <button 
                  className="hamburger-btn" 
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <i className="fas fa-bars"></i>
                  {getCartItemsCount() > 0 && !showMenu && (
                    <span className="hamburger-dot"></span>
                  )}
                </button>
                {showMenu && (
                  <div className="dropdown-menu">
                    <button onClick={() => { setShowMenu(false); navigate('/cart'); }}>
                      <i className="fas fa-shopping-cart"></i> My Cart
                      {getCartItemsCount() > 0 && (
                        <span className="menu-cart-count">{getCartItemsCount()}</span>
                      )}
                    </button>
                    <button onClick={() => alert('My Orders - Coming Soon!')}>
                      <i className="fas fa-box"></i> My Orders
                    </button>
                    <button onClick={logout}>
                      <i className="fas fa-sign-out-alt"></i> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>
      <Login isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default Header;
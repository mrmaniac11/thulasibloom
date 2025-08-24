import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Cart from './Cart';

const Header = () => {
  const { getCartItemsCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
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
            <div className="cart-icon" onClick={() => setIsCartOpen(true)}>
              <i className="fas fa-shopping-cart"></i>
              <span className="cart-count">{getCartItemsCount()}</span>
            </div>
          </div>
        </nav>
      </header>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
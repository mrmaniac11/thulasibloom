import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { products } from '../data/products';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();
  const product = products[id];
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [benefitsVisible, setBenefitsVisible] = useState(false);
  const [addedMessage, setAddedMessage] = useState('');
  const benefitsRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBenefitsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (benefitsRef.current) {
      observer.observe(benefitsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/products');
    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };



  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product not found</h2>
        <Link to="/products">Back to Products</Link>
      </div>
    );
  }

  const handleAddToCart = (weight, price) => {
    addToCart(product, weight, price);
    setAddedMessage(`1 pack of ${weight} added to cart`);
    setTimeout(() => setAddedMessage(''), 3000);
  };

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-wrapper">
          <button onClick={handleBackClick} className="back-link">
            <i className="fas fa-arrow-left"></i>
          </button>
          
          <div className="product-detail">
            <div className="product-badge">{product.badge}</div>
            <div className="product-image-section">
            <img src={product.image} alt={product.name} />
          </div>
          
          <div className="product-info-section">
            <h1>{product.name}</h1>
            <p className="product-description">{product.description}</p>
            {addedMessage && (
              <div className="success-message">
                {addedMessage}
              </div>
            )}
            
            <div className="detail-section" ref={benefitsRef}>
              <h3>Key Benefits</h3>
              <ul className={`benefits-list ${benefitsVisible ? 'animate' : ''}`}>
                {product.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>

            <div className="detail-section">
              <h3 
                className="ingredients-toggle"
                onClick={() => setIngredientsOpen(!ingredientsOpen)}
              >
                Ingredients &nbsp;&nbsp;<i className={`fas ${ingredientsOpen ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </h3>
              {ingredientsOpen && (
                <div className="ingredients-grid">
                  {product.ingredients.map((ingredient, index) => (
                    <span key={index} className="ingredient-tag">
                      {ingredient}
                      <div className="ingredient-tooltip">
                        <img 
                          src={`/images/ingredients/${ingredient.toLowerCase().replace(/\s+/g, '-')}.jpg`} 
                          alt={ingredient}
                          onError={(e) => {
                            e.target.src = '/images/ingredients/default.jpg';
                          }}
                        />
                      </div>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-section">
              <h3>Available Sizes</h3>
              <div className="pricing-options">
                {Object.entries(product.pricing).map(([weight, price]) => {
                  const cartQty = cart.filter(item => item.productId === product.id && item.weight === weight)
                    .reduce((total, item) => total + item.quantity, 0);
                  return (
                    <div key={weight}>
                      <div className="price-option-detail">
                        <div className="price-info">
                          <span className="weight">{weight}</span>
                          <span className="price">₹{price}</span>
                        </div>
                        <button 
                          className="add-to-cart-detail"
                          onClick={() => handleAddToCart(weight, price)}
                        >
                          Add to Cart
                        </button>
                      </div>
                      {cartQty > 0 && (
                        <div className="cart-qty-below">{cartQty} quantity of {weight} in cart</div>
                      )}
                    </div>
                  );
                })}
                {Object.keys(product.pricing).length === 0 && (
                  <p className="coming-soon-text">Pricing details coming soon!</p>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
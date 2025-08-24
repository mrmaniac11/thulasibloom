import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import NotifyModal from './NotifyModal';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [showIngredients, setShowIngredients] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);


  const handleAddToCart = (weight, price) => {
    addToCart(product, weight, price);
  };

  const handleNotifyClick = () => {
    setShowNotifyModal(true);
  };

  return (
    <>
      <div 
        className="product-card"
        onMouseEnter={() => setShowIngredients(true)}
        onMouseLeave={() => setShowIngredients(false)}
      >
        <div className="product-image">
          <div className="product-badge">{product.badge}</div>
          <img src={product.image} alt={product.name} />
          <div className="product-overlay">
            <Link to={`/product/${product.id}`} className="quick-view-btn">
              <i className="fas fa-eye"></i> View Details
            </Link>
          </div>
        </div>
        
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          
          <div className="product-pricing">
            {Object.entries(product.pricing).map(([weight, price]) => (
              <div key={weight} className="price-option">
                <span className="weight">{weight}</span>
                <span className="price">₹{price}</span>
              </div>
            ))}
          </div>
          
          <div className="product-actions">
            {Object.entries(product.pricing).map(([weight, price]) => (
              <button 
                key={weight}
                className="add-to-cart"
                onClick={() => handleAddToCart(weight, price)}
              >
                Add {weight}
              </button>
            ))}
            {Object.keys(product.pricing).length === 0 && (
              <button className="notify-btn" onClick={handleNotifyClick}>
                Notify Me
              </button>
            )}
          </div>
        </div>

        {showIngredients && (
          <div className="ingredients-tooltip">
            <div className="ingredients-list">
              <h4>Ingredients:</h4>
              <div className="ingredients-grid">
                {product.ingredients.map((ingredient, index) => (
                  <span key={index}>{ingredient}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <NotifyModal 
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        product={product}
      />
    </>
  );
};

export default ProductCard;
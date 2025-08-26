import React from 'react';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';

const ProductList = () => {
  const scrollToProducts = () => {
    document.getElementById('products').scrollIntoView({
      behavior: 'smooth'
    });
  };

  const handleBubbleClick = (productId) => {
    scrollToProducts();
    setTimeout(() => {
      window.location.hash = `/product/${productId}`;
    }, 800);
  };

  return (
    <div className="products-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Nourish Your Body with Nature's Best</h1>
          <p className="hero-subtitle">Premium health mix products crafted with the finest natural ingredients</p>
        </div>
        <div className="hero-animation">
          <div 
            className="product-bubble healthmix-bubble"
            onClick={() => handleBubbleClick('healthmix')}
          >
            <div className="bubble-content">
              <div className="bubble-icon">🌾</div>
              <div className="bubble-text">
                <h3>Health Mix</h3>
                <p>Complete Nutrition</p>
              </div>
            </div>
            <div className="bubble-slogan">24 Premium Ingredients for Total Wellness</div>
          </div>
          
          <div 
            className="product-bubble millet-bubble"
            onClick={() => handleBubbleClick('millet-healthmix')}
          >
            <div className="bubble-content">
              <div className="bubble-icon">🌱</div>
              <div className="bubble-text">
                <h3>Millet Mix</h3>
                <p>Gluten-Free Power</p>
              </div>
            </div>
            <div className="bubble-slogan">Pure Millet Energy for Active Life</div>
          </div>
          
          <div 
            className="product-bubble womens-bubble"
            onClick={() => handleBubbleClick('womens-healthmix')}
          >
            <div className="bubble-content">
              <div className="bubble-icon">🌸</div>
              <div className="bubble-text">
                <h3>Women's Mix</h3>
                <p>Specially Crafted</p>
              </div>
            </div>
            <div className="bubble-slogan">Empowering Women's Health & Vitality</div>
          </div>
        </div>
      </section>

      <section id="products" className="products-section">
        <div className="container">
          <h2 className="section-title">Our Premium Products</h2>
          <div className="products-grid">
            {Object.values(products).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductList;
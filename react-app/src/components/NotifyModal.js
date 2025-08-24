import React, { useState } from 'react';

const NotifyModal = ({ isOpen, onClose, product }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email && !phone) {
      setMessage('Please provide either email or phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          email: email || null,
          phone: phone || null
        })
      });

      if (response.ok) {
        setMessage('Thank you! We\'ll notify you when this product is available.');
        setTimeout(() => {
          onClose();
          setEmail('');
          setPhone('');
          setMessage('');
        }, 2000);
      } else {
        setMessage('Failed to save notification. Please try again.');
      }
    } catch (error) {
      setMessage('Failed to save notification. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Get Notified</h3>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p>We'll notify you when <strong>{product?.name}</strong> is back in stock!</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            
            {message && (
              <div className={`message ${message.includes('Thank you') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
            
            <button 
              type="submit" 
              className="notify-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Notify Me'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotifyModal;
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple mock login - in real app, validate with server
    const userData = {
      id: Date.now(),
      name: formData.name || 'User',
      email: formData.email,
      phone: formData.phone
    };
    login(userData);
    onClose();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content auth-modal">
        <div className="auth-header">
          <div className="auth-icon">
            <i className="fas fa-user-circle"></i>
          </div>
          <h2>{isLogin ? 'Welcome Back!' : 'Join ThulasiBloom'}</h2>
          <p>{isLogin ? 'Sign in to your account' : 'Create your account'}</p>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        
        <div className="auth-body">
          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="input-group">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  required
                />
              </div>
            )}
            
            <div className="input-group">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                required
              />
            </div>
            
            <div className="input-group">
              <i className="fas fa-phone"></i>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number"
                required
              />
            </div>
            
            <div className="input-group">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
              />
            </div>
            
            <button type="submit" className="auth-submit-btn">
              <i className="fas fa-sign-in-alt"></i>
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-toggle">
            <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="auth-toggle-btn"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
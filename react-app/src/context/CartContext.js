import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://thulasibloom-backend.onrender.com/api'
  : 'http://localhost:5000/api';

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload };
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from server on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await fetch(`${API_BASE}/cart`);
      const cartItems = await response.json();
      const formattedItems = cartItems.map(item => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        weight: item.weight,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }));
      dispatch({ type: 'SET_CART', payload: formattedItems });
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const addToCart = async (product, weight, price) => {
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          weight,
          price,
          image: product.image
        })
      });
      
      if (response.ok) {
        loadCart(); // Reload cart from server
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const removeFromCart = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/cart/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        dispatch({ type: 'REMOVE_FROM_CART', payload: id });
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) {
      console.error('Quantity must be at least 1');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/cart/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      
      if (response.ok) {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
      } else {
        const error = await response.json();
        console.error('Server error:', error.error);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        dispatch({ type: 'CLEAR_CART' });
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart: state.items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
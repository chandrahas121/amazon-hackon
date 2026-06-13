import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('revive_cart') || '[]');
    } catch {
      return [];
    }
  });

  const persist = (next) => {
    setCart(next);
    localStorage.setItem('revive_cart', JSON.stringify(next));
  };

  const addToCart = (listing) => {
    setCart((prev) => {
      if (prev.find((item) => item.id === listing.id)) return prev;
      const next = [...prev, listing];
      localStorage.setItem('revive_cart', JSON.stringify(next));
      return next;
    });
  };

  const removeFromCart = (id) => {
    persist(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => persist([]);

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

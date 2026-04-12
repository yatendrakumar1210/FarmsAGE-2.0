import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, selectedWeight) => {
    setCart((prevCart) => {
      // Check if item already exists in cart with the same weight
      const existingItemIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.weight === selectedWeight
      );

      if (existingItemIndex >= 0) {
        // Increment quantity if same product & weight exists
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1,
        };
        return updatedCart;
      }

      // Add new item
      return [...prevCart, { ...product, weight: selectedWeight, quantity: 1 }];
    });
  };

  const removeFromCart = (productId, weight) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === productId && item.weight === weight))
    );
  };

  const updateQuantity = (productId, weight, delta) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === productId && item.weight === weight) {
          const newQuantity = item.quantity + delta;
          return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
        }
        return item;
      });
    });
  };

  const updateItemWeight = (productId, oldWeight, newWeight, newPrice) => {
    setCart((prevCart) => {
      const itemToUpdateIndex = prevCart.findIndex(
        (item) => item.id === productId && item.weight === oldWeight
      );
      if (itemToUpdateIndex === -1) return prevCart;

      const itemToUpdate = prevCart[itemToUpdateIndex];
      const existingNewWeightIndex = prevCart.findIndex(
        (item) => item.id === productId && item.weight === newWeight
      );

      if (
        existingNewWeightIndex >= 0 &&
        existingNewWeightIndex !== itemToUpdateIndex
      ) {
        // Merge quantities if the target weight already exists
        const updatedCart = [...prevCart];
        updatedCart[existingNewWeightIndex] = {
          ...updatedCart[existingNewWeightIndex],
          quantity: updatedCart[existingNewWeightIndex].quantity + itemToUpdate.quantity,
        };
        return updatedCart.filter((_, index) => index !== itemToUpdateIndex);
      } else {
        // Otherwise just update the weight and price
        const updatedCart = [...prevCart];
        updatedCart[itemToUpdateIndex] = {
          ...itemToUpdate,
          weight: newWeight,
          price: newPrice,
        };
        return updatedCart;
      }
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, updateItemWeight, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};


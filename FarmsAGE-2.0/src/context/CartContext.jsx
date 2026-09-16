import { createContext, useContext, useState, useEffect } from "react";
import { getWeightMultiplier } from "../utils/weightUtils";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("farmsage_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("farmsage_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  const getItemId = (item) => item?._id || item?.id;

  const addToCart = (product, selectedWeight) => {
    if (!product) return;
    const productVendorId = product.vendorId || "global";
    const productId = getItemId(product);
    const weightToUse = selectedWeight || product.unit || "1 kg";

    // 🥡 Zomato Style: One shop at a time check
    if (cart.length > 0) {
      const cartVendorId = cart[0].vendorId || "global";
      if (cartVendorId !== productVendorId) {
        const wantsToReplace = window.confirm(
          "Your cart contains items from another store. Clear cart and add this item instead?"
        );
        if (wantsToReplace) {
          setCart([{ ...product, _id: productId, id: productId, weight: weightToUse, quantity: 1 }]);
        }
        return;
      }
    }

    setCart((prevCart) => {
      // Check if item already exists in cart with the same weight
      const existingItemIndex = prevCart.findIndex(
        (item) => String(getItemId(item)) === String(productId) && item.weight === weightToUse
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
      return [...prevCart, { ...product, _id: productId, id: productId, weight: weightToUse, quantity: 1 }];
    });
  };

  const removeFromCart = (productId, weight) => {
    if (!productId) return;
    setCart((prevCart) =>
      prevCart.filter((item) => {
        const id = getItemId(item);
        const matches = String(id) === String(productId) && (!weight || item.weight === weight);
        return !matches;
      })
    );
  };

  const updateQuantity = (productId, weight, delta) => {
    if (!productId) return;
    setCart((prevCart) => {
      return prevCart.map((item) => {
        const id = getItemId(item);
        if (String(id) === String(productId) && (!weight || item.weight === weight)) {
          const newQuantity = item.quantity + delta;
          return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
        }
        return item;
      });
    });
  };

  const updateItemWeight = (productId, oldWeight, newWeight, newPrice) => {
    if (!productId) return;
    setCart((prevCart) => {
      const itemToUpdateIndex = prevCart.findIndex(
        (item) => String(getItemId(item)) === String(productId) && String(item.weight).toLowerCase() === String(oldWeight).toLowerCase()
      );
      if (itemToUpdateIndex === -1) return prevCart;

      const itemToUpdate = prevCart[itemToUpdateIndex];
      const existingNewWeightIndex = prevCart.findIndex(
        (item) => String(getItemId(item)) === String(productId) && String(item.weight).toLowerCase() === String(newWeight).toLowerCase()
      );

      // Determine base price per 1kg
      const oldMult = getWeightMultiplier(oldWeight);
      const basePricePerKg = itemToUpdate.originalPricePerKg || (itemToUpdate.price / (oldMult || 1));

      if (
        existingNewWeightIndex >= 0 &&
        existingNewWeightIndex !== itemToUpdateIndex
      ) {
        // Merge quantities if the target weight already exists
        const updatedCart = [...prevCart];
        updatedCart[existingNewWeightIndex] = {
          ...updatedCart[existingNewWeightIndex],
          quantity: updatedCart[existingNewWeightIndex].quantity + itemToUpdate.quantity,
          price: newPrice,
          originalPricePerKg: basePricePerKg,
        };
        return updatedCart.filter((_, index) => index !== itemToUpdateIndex);
      } else {
        // Otherwise just update the weight and price
        const updatedCart = [...prevCart];
        updatedCart[itemToUpdateIndex] = {
          ...itemToUpdate,
          weight: newWeight,
          price: newPrice,
          originalPricePerKg: basePricePerKg,
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



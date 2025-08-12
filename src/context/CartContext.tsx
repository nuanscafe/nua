import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '../data/menuData';

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  tableId: string | null;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setTableId: (id: string) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState<string | null>(null);

  // item.id'yi stringe normalize ederek duplikeleri tutarlı biçimde birleştir
  const addToCart = (item: MenuItem) => {
    const normalizedId = String((item as any)?.id ?? '');
    const normalizedItem: MenuItem = { ...item, id: normalizedId } as MenuItem;

    setItems(prevItems => {
      // Mevcut listede id'ler string olarak kıyaslanır
      const existingItem = prevItems.find(i => String(i.id) === normalizedId);
      if (existingItem) {
        return prevItems.map(i =>
          String(i.id) === normalizedId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      // Yeni eklenen ürünün adı bazı veri setlerinde name yerine name_tr olabilir; Cart/FloatingCart tutarlılığı için saklarken orijinal alanları koruyoruz
      return [...prevItems, { ...(normalizedItem as any), quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => String(item.id) !== String(itemId)));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        String(item.id) === String(itemId) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      tableId,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      setTableId,
      getTotalPrice,
      getTotalItems
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

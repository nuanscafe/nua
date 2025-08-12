import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

interface FloatingCartProps {
  tableId: string;
}

const FloatingCart: React.FC<FloatingCartProps> = ({ tableId }) => {
  const { items, getTotalItems, getTotalPrice, updateQuantity, removeFromCart } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  if (getTotalItems() === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
        >
          <div className="relative">
            🛒
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {getTotalItems()}
            </span>
          </div>
          <span className="font-medium">{getTotalPrice()} ₺</span>
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-xl border-2 border-amber-200 w-80 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="bg-amber-500 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold">Sepetim ({getTotalItems()} ürün)</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white hover:text-amber-200"
            >
              ✕
            </button>
          </div>

          {/* Items */}
          <div className="max-h-48 overflow-y-auto p-3 space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name_tr}</div>
                  <div className="text-amber-600 text-sm">{item.price} ₺</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(String(item.id), item.quantity - 1)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-6 h-6 rounded-full text-xs"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(String(item.id), item.quantity + 1)}
                    className="bg-amber-500 hover:bg-amber-600 text-white w-6 h-6 rounded-full text-xs"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(String(item.id))}
                    className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs ml-1"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t p-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold">Toplam:</span>
              <span className="font-bold text-amber-600 text-lg">{getTotalPrice()} ₺</span>
            </div>
            <button
              onClick={() => navigate(`/checkout/${tableId}`)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              Siparişi Tamamla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingCart;
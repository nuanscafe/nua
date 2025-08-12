import React from 'react';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, tableId } = useCart();

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sepetiniz</h2>
        <p className="text-gray-600">Sepetiniz boş.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Sepetiniz</h2>
      
      {tableId && (
        <div className="mb-4 p-2 bg-amber-50 rounded-md">
          <p className="text-amber-700">Masa: {tableId}</p>
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {items.map(item => (
          <div key={item.id} className="py-4 flex justify-between">
            <div className="flex items-center">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-16 h-16 object-cover rounded-md mr-4"
              />
              <div>
                <h3 className="text-gray-800 font-medium">{item.name}</h3>
                <p className="text-gray-600 text-sm">{item.price} ₺</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => updateQuantity(String(item.id), item.quantity - 1)}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-3 py-1">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(String(item.id), item.quantity + 1)}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeFromCart(String(item.id))}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="flex justify-between text-lg font-semibold">
          <span>Toplam:</span>
          <span>{getTotalPrice()} ₺</span>
        </div>
        
        <Link 
          to={tableId ? `/checkout/${tableId}` : '/checkout'}
          className="mt-4 block w-full bg-amber-500 hover:bg-amber-600 text-white text-center py-3 px-4 rounded-md transition-colors"
        >
          Siparişi Tamamla
        </Link>
      </div>
    </div>
  );
};

export default Cart;

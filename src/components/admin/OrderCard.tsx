import React from 'react';
import { Timestamp } from 'firebase/firestore';

type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  tableId: string;
  sessionId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalPrice: number;
  orderNote?: string;
  timestamp: Timestamp;
  paymentStatus?: 'pending' | 'paid';
}

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  onOrderSelect: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusUpdate, onOrderSelect }) => {
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return { 
          color: 'bg-green-100 border-green-300 text-green-800', 
          label: 'Yeni Sipariş',
          bgColor: 'bg-green-50'
        };
      case 'preparing':
        return { 
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800', 
          label: 'Hazırlanıyor',
          bgColor: 'bg-yellow-50'
        };
      case 'ready':
        return { 
          color: 'bg-blue-100 border-blue-300 text-blue-800', 
          label: 'Hazır',
          bgColor: 'bg-blue-50'
        };
      case 'delivered':
        return { 
          color: 'bg-gray-100 border-gray-300 text-gray-800', 
          label: 'Teslim Edildi',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div 
      className={`${statusInfo.bgColor} rounded-lg border-2 ${statusInfo.color} p-4 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
      onClick={() => onOrderSelect(order)}
    >
      {/* Masa Başlığı */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {/* tableId güvenli kullanım */}
            {typeof order.tableId === 'string' && order.tableId.length > 0
              ? order.tableId.replace('table-', 'Masa ')
              : 'Masa -'}
          </h3>
          <p className="text-sm text-gray-600">
            {formatTime(order.timestamp)}
          </p>
          <p className="text-xs text-gray-500">
            {/* sessionId güvenli kullanım: undefined/null ya da string olmayan durumları ele al */}
            {(() => {
              const sid = (order as any)?.sessionId;
              const text =
                typeof sid === 'string' && sid.length > 0
                  ? `Session: ${sid.slice(-8)}`
                  : 'Session: -';
              return text;
            })()}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
          {statusInfo.label}
        </div>
      </div>

      {/* Sipariş Özeti */}
      <div className="mb-3">
        <div className="text-sm text-gray-700">
          <span className="font-medium">{order.items.length} ürün</span>
          <span className="mx-2">•</span>
          <span className="font-bold text-amber-600">{order.totalPrice} ₺</span>
        </div>
        
        {/* İlk 2 ürünü göster */}
        <div className="mt-2 space-y-1">
          {(Array.isArray(order.items) ? order.items : []).slice(0, 2).map((item, index) => (
            <div key={index} className="text-xs text-gray-600">
              {item?.quantity}x {item?.name ?? '-'}
            </div>
          ))}
          {Array.isArray(order.items) && order.items.length > 2 && (
            <div className="text-xs text-gray-500 italic">
              +{order.items.length - 2} ürün daha...
            </div>
          )}
        </div>
      </div>

      {/* Durum Değiştirme Butonları */}
      <div className="flex gap-2 mt-3">
        {order.status === 'new' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, 'preparing');
            }}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-2 px-3 rounded-md transition-colors"
          >
            Hazırla
          </button>
        )}
        
        {order.status === 'preparing' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, 'ready');
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded-md transition-colors"
          >
            Hazır
          </button>
        )}
        
        {order.status === 'ready' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, 'delivered');
            }}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded-md transition-colors"
          >
            Teslim Et
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrderSelect(order);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white text-xs py-2 px-3 rounded-md transition-colors"
        >
          Detay
        </button>
      </div>

      {/* Sipariş Notu */}
      {order.orderNote && (
        <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs text-gray-700">
          <span className="font-medium">Not:</span> {order.orderNote}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
import React from 'react';
import { Timestamp } from 'firebase/firestore';
import OrderCard from './OrderCard';

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

interface OrderGridProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  onOrderSelect: (order: Order) => void;
}

const OrderGrid: React.FC<OrderGridProps> = ({ orders, onStatusUpdate, onOrderSelect }) => {
  // Defensively check if orders is an array before processing
  if (!Array.isArray(orders)) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-600">Siparişler yükleniyor...</h3>
      </div>
    );
  }

  // Siparişleri duruma göre grupla (tamamen güvenli)
  const safeOrders = Array.isArray(orders) ? orders.filter(Boolean) : [];
  const groupedOrders = {
    new: safeOrders.filter(order => order?.status === 'new'),
    preparing: safeOrders.filter(order => order?.status === 'preparing'),
    ready: safeOrders.filter(order => order?.status === 'ready'),
    delivered: safeOrders.filter(order => order?.status === 'delivered'),
  };

  const getSectionTitle = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return `🆕 Yeni Siparişler (${groupedOrders.new.length})`;
      case 'preparing':
        return `👨‍🍳 Hazırlanıyor (${groupedOrders.preparing.length})`;
      case 'ready':
        return `✅ Hazır (${groupedOrders.ready.length})`;
      case 'delivered':
        return `📦 Teslim Edildi (${groupedOrders.delivered.length})`;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz sipariş yok</h3>
        <p className="text-gray-500">Yeni siparişler geldiğinde burada görünecek.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Yeni Siparişler */}
      {groupedOrders.new.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {getSectionTitle('new')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedOrders.new.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={onStatusUpdate}
                onOrderSelect={onOrderSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hazırlanıyor */}
      {groupedOrders.preparing.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {getSectionTitle('preparing')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedOrders.preparing.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={onStatusUpdate}
                onOrderSelect={onOrderSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hazır */}
      {groupedOrders.ready.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {getSectionTitle('ready')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedOrders.ready.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={onStatusUpdate}
                onOrderSelect={onOrderSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Teslim Edildi (Son 10 sipariş) */}
      {Array.isArray(groupedOrders.delivered) && groupedOrders.delivered.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {getSectionTitle('delivered')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(groupedOrders.delivered || []).slice(0, 10).map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={onStatusUpdate}
                onOrderSelect={onOrderSelect}
              />
            ))}
          </div>
          {Array.isArray(groupedOrders.delivered) && groupedOrders.delivered.length > 10 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Son 10 teslim edilmiş sipariş gösteriliyor. Toplam: {groupedOrders.delivered.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderGrid;

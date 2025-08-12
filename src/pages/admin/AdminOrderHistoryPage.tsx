import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';

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

const AdminOrderHistoryPage: React.FC = () => {
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Normalize Firestore order data
  const normalizeOrder = (raw: any): Order => {
    const sessionId = typeof raw?.sessionId === 'string' && raw.sessionId.length > 0 ? raw.sessionId : '';
    const itemsArray = Array.isArray(raw?.items) ? raw.items : [];
    const items = itemsArray
      .filter((it: any) => it && typeof it === 'object')
      .map((it: any) => ({
        id: String(it?.id ?? ''),
        name: String(it?.name ?? 'Tanımsız'),
        price: Number.isFinite(it?.price) ? Number(it.price) : 0,
        quantity: Number.isFinite(it?.quantity) ? Number(it.quantity) : 0,
      })) as OrderItem[];

    const statusValues: OrderStatus[] = ['new', 'preparing', 'ready', 'delivered'];
    const status = statusValues.includes(raw?.status) ? raw.status : 'new';
    const totalPrice = Number.isFinite(raw?.totalPrice) ? Number(raw.totalPrice) : 0;
    const tableId = typeof raw?.tableId === 'string' && raw.tableId.length > 0 ? raw.tableId : '';
    const orderNote = typeof raw?.orderNote === 'string' && raw.orderNote.length > 0 ? raw.orderNote : undefined;
    const timestamp: Timestamp = raw?.timestamp && typeof raw.timestamp.toDate === 'function' ? raw.timestamp : Timestamp.now();
    const paymentStatus = raw?.paymentStatus === 'paid' ? 'paid' : 'pending';

    return {
      id: String(raw?.id ?? ''),
      tableId,
      sessionId,
      items,
      status,
      totalPrice,
      orderNote,
      timestamp,
      paymentStatus,
    };
  };

  // Tarih aralığı hesaplama
  const getDateRange = (period: 'today' | 'week' | 'month') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return { start: Timestamp.fromDate(today), end: Timestamp.now() };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: Timestamp.fromDate(weekStart), end: Timestamp.now() };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return { start: Timestamp.fromDate(monthStart), end: Timestamp.now() };
    }
  };

  // Ödenen siparişleri getir
  useEffect(() => {
    const ordersCollection = collection(db, 'orders');
    const ordersQuery = query(
      ordersCollection,
      where('paymentStatus', '==', 'paid'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const { start, end } = getDateRange(selectedPeriod);
        const ordersList = snapshot.docs.map((d) => {
          const data = d.data();
          return normalizeOrder({ id: d.id, ...data });
        }).filter(order => {
          // Client-side tarih filtrelemesi
          return order.timestamp.toMillis() >= start.toMillis() && 
                 order.timestamp.toMillis() <= end.toMillis();
        });
        setPaidOrders(ordersList);
      },
      (error) => {
        console.error('Geçmiş siparişler yüklenirken hata:', error);
      }
    );

    return () => unsubscribe();
  }, [selectedPeriod]);

  // Tarih formatı
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Günlük gruplandırma
  const groupOrdersByDate = (orders: Order[]) => {
    const groups: { [key: string]: Order[] } = {};
    
    orders.forEach(order => {
      const date = order.timestamp.toDate();
      const dateKey = new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });
    
    return groups;
  };

  const groupedOrders = groupOrdersByDate(paidOrders);
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Geçmiş Siparişler</h1>
      
      {/* Filtre Butonları */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setSelectedPeriod('today')}
          className={`px-4 py-2 rounded-md ${selectedPeriod === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Bugün
        </button>
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`px-4 py-2 rounded-md ${selectedPeriod === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Son 7 Gün
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`px-4 py-2 rounded-md ${selectedPeriod === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Son 30 Gün
        </button>
      </div>

      {/* Özet Bilgiler */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700">Toplam Sipariş</h3>
          <p className="text-2xl font-bold text-blue-600">{paidOrders.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700">Toplam Gelir</h3>
          <p className="text-2xl font-bold text-green-600">{totalRevenue} ₺</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700">Ortalama Sipariş</h3>
          <p className="text-2xl font-bold text-purple-600">
            {paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0} ₺
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sipariş Listesi */}
        <div className="lg:w-2/3">
          {Object.keys(groupedOrders).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">Seçilen dönemde ödenen sipariş bulunamadı.</p>
            </div>
          ) : (
            Object.entries(groupedOrders).map(([date, orders]) => (
              <div key={date} className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                  {date} ({orders.length} sipariş - {orders.reduce((sum, order) => sum + order.totalPrice, 0)} ₺)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {order.tableId.replace('table-', 'Masa ')}
                          </h3>
                          <p className="text-sm text-gray-600">{formatDate(order.timestamp)}</p>
                        </div>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Ödendi
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <span>{order.items.length} ürün</span>
                        <span className="mx-2">•</span>
                        <span className="font-bold text-green-600">{order.totalPrice} ₺</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sipariş Detayı */}
        <div className="lg:w-1/3">
          {selectedOrder ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Sipariş Detayı</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-3 bg-green-50 rounded-md">
                <p className="text-green-700 font-medium">Masa: {selectedOrder.tableId}</p>
                <p className="text-green-700 text-sm">{formatDate(selectedOrder.timestamp)}</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 mt-2">
                  Ödendi
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">Sipariş Öğeleri</h3>
                <div className="border-t border-b border-gray-200 py-2 divide-y divide-gray-200">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="py-2 flex justify-between">
                      <div>
                        <span className="text-gray-800">{item.quantity} x {item.name}</span>
                      </div>
                      <span className="text-gray-800 font-medium">{item.price * item.quantity} ₺</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-lg font-bold mb-4">
                <span>Toplam:</span>
                <span className="text-green-600">{selectedOrder.totalPrice} ₺</span>
              </div>

              {selectedOrder.orderNote && (
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Sipariş Notu</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{selectedOrder.orderNote}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500">Detayları görüntülemek için bir sipariş seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderHistoryPage;
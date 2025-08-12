import { db } from '../../firebase'; // Import the initialized Firestore instance
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp, where, writeBatch, getDocs, addDoc } from 'firebase/firestore'; // Import Firestore functions
import React, { useState, useEffect, useRef } from 'react';
import WaiterCallNotifications from '../../components/admin/WaiterCallNotifications';
import OrderGrid from '../../components/admin/OrderGrid';
import { playNewOrderSound } from '../../utils/audioUtils';
import { tables } from '../../data/menuData';

// Sipariş durumları
type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered';

// Sipariş öğesi arayüzü (matches the structure saved in CheckoutPage.tsx)
interface OrderItem {
  id: string; // Firestore document ID for menu item (if stored) or a unique identifier
  name: string;
  price: number;
  quantity: number;
}

// Sipariş arayüzü (matches the structure saved in CheckoutPage.tsx)
interface Order {
  id: string; // Firestore document ID for the order
  tableId: string;
  sessionId: string; // Unique session ID to distinguish different orders from same table
  items: OrderItem[];
  status: OrderStatus;
  totalPrice: number;
  orderNote?: string; // Use orderNote to match the field name in CheckoutPage.tsx
  timestamp: Timestamp; // Use Timestamp type for Firestore timestamp
  paymentStatus?: 'pending' | 'paid'; // Payment status
}



const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]); // State for orders, initialized as empty array
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previousOrderCount, setPreviousOrderCount] = useState(0); // State to track previous order count
  // Masa taşıma UI state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  
  // Sipariş durumu için renk ve etiket belirleme
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return { color: 'bg-green-100 text-green-800', label: 'Yeni' };
      case 'preparing':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Hazırlanıyor' };
      case 'ready':
        return { color: 'bg-blue-100 text-blue-800', label: 'Hazır' };
      case 'delivered':
        return { color: 'bg-gray-100 text-gray-800', label: 'Teslim Edildi' };
    }
  };
  
  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  // Simple WebAudio beep: repeats short beeps for ~3 seconds
  const playWaiterBeep = () => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const durationMs = 300; // single beep length
      const gapMs = 300; // gap between beeps
      const totalMs = 3000; // ~3 seconds total
      const oscillatorType: OscillatorType = 'sine';
      const frequency = 880; // A5

      let elapsed = 0;
      const playSingleBeep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscillatorType;
        osc.frequency.value = frequency;
        osc.connect(gain);
        gain.connect(ctx.destination);
        // Envelope to avoid clicks
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain.gain.linearRampToValueAtTime(0.0, now + durationMs / 1000);

        osc.start(now);
        osc.stop(now + durationMs / 1000);
        osc.onended = () => {
          // cleanup nodes
          osc.disconnect();
          gain.disconnect();
        };
      };

      const interval = setInterval(() => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        playSingleBeep();
        elapsed += durationMs + gapMs;
        if (elapsed >= totalMs) {
          clearInterval(interval);
          // close after short delay to allow last beep to finish
          setTimeout(() => ctx.close().catch(() => {}), 500);
        }
      }, durationMs + gapMs);
    } catch {
      // no-op if WebAudio not available
    }
  };
  
  // Function to show notification
  const showNewOrderNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Yeni Sipariş!', {
        body: 'Yeni bir sipariş geldi.',
        icon: '/favicon.ico'
      });
    }
  };
  
  // Normalize Firestore order data to protect UI from undefined/invalid fields
  const normalizeOrder = (raw: any): Order => {
    const sessionId =
      typeof raw?.sessionId === 'string' && raw.sessionId.length > 0
        ? raw.sessionId
        : '';

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

    const tableId =
      typeof raw?.tableId === 'string' && raw.tableId.length > 0 ? raw.tableId : '';

    const orderNote =
      typeof raw?.orderNote === 'string' && raw.orderNote.length > 0
        ? raw.orderNote
        : undefined;

    const timestamp: Timestamp =
      raw?.timestamp && typeof raw.timestamp.toDate === 'function'
        ? raw.timestamp
        : (Timestamp.now() as unknown as Timestamp);

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

  // Effect to fetch orders from Firestore in real-time and play sound on new order
  useEffect(() => {
    const ordersCollection = collection(db, 'orders');
    // Tüm siparişleri getir (eski sistem gibi)
    const ordersQuery = query(ordersCollection, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersList = snapshot.docs.map((d) => {
          const data = d.data();
          // pass doc.id into normalize so id is guaranteed
          return normalizeOrder({ id: d.id, ...data });
        });

        // Check if new orders have arrived
        if (ordersList.length > previousOrderCount && previousOrderCount !== 0) {
          playNewOrderSound();
          showNewOrderNotification();
        }

        // Sadece ödenmemiş siparişleri göster
        const pendingOrders = ordersList.filter(order => order.paymentStatus !== 'paid');
        setOrders(pendingOrders);
        setPreviousOrderCount(ordersList.length); // Update the previous order count
      },
      (error) => {
        console.error('onSnapshot error for orders:', error);
        // Fail-safe: keep previous orders but avoid crash
      }
    );

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [previousOrderCount]); // Add previousOrderCount to dependency array

  // Listen waiterCalls and beep on new pending calls
  useEffect(() => {
    // Track seen IDs to avoid initial-load beeps
    const seenIdsRef = { current: new Set<string>() } as { current: Set<string> };

    const callsCol = collection(db, 'waiterCalls');
    // Most recent first; if needed we could filter pending with where('status','==','pending')
    const callsQuery = query(callsCol, orderBy('timestamp', 'desc'));

    const unsub = onSnapshot(
      callsQuery,
      (snap) => {
        snap
          .docChanges()
          .filter((ch) => ch.type === 'added')
          .forEach((ch) => {
            const id = ch.doc.id;
            if (seenIdsRef.current.has(id)) return;
            seenIdsRef.current.add(id);
            const data: any = ch.doc.data();
            const status = typeof data?.status === 'string' ? data.status : 'pending';
            const tableId = typeof data?.tableId === 'string' ? data.tableId : 'unknown';
            if (status === 'pending') {
              // play short repeating beep (~3s)
              playWaiterBeep();
              // optional notification
              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification('Garson çağrısı', {
                    body: `Masa: ${tableId}`,
                    icon: '/favicon.ico',
                  });
                } catch {}
              }
            }
          });
      },
      (err) => {
        console.error('onSnapshot error for waiterCalls:', err);
      }
    );

    return () => unsub();
  }, []);

  // Sipariş durumunu güncelleme (in Firestore)
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => { // Make function asynchronous
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      // The onSnapshot listener will automatically update the local state
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Sipariş durumu güncellenirken bir hata oluştu.');
    }
  };

  // Masa taşıma işlemi
  const handleTransferOrders = async () => {
    if (!selectedOrder) return;
    const sourceTableId = selectedOrder.tableId;
    const targetId = targetTableId.trim();
    if (!targetId || targetId === sourceTableId) {
      setTransferError('Lütfen farklı bir hedef masa seçin.');
      return;
    }
    setTransferError(null);
    setTransferLoading(true);
    try {
      // 1) Kaynak: pending tüm siparişler
      const srcQ = query(
        collection(db, 'orders'),
        where('tableId', '==', sourceTableId),
        where('paymentStatus', '==', 'pending')
      );
      const srcSnap = await getDocs(srcQ);
      const sourceDocs = srcSnap.docs;
      if (sourceDocs.length === 0) {
        setTransferError('Taşınacak bekleyen sipariş bulunamadı.');
        setTransferLoading(false);
        return;
      }

      // 2) Hedef: pending ilk sipariş (varsa)
      const tgtQ = query(
        collection(db, 'orders'),
        where('tableId', '==', targetId),
        where('paymentStatus', '==', 'pending')
      );
      const tgtSnap = await getDocs(tgtQ);
      const targetDoc = tgtSnap.docs[0] || null;

      // 3) Tüm kaynak siparişlerin öğelerini topla
      type Item = { id: string; name: string; price: number; quantity: number };
      const aggregate: Record<string, Item> = {};
      let combinedNoteParts: string[] = [];
      let combinedTotal = 0;

      sourceDocs.forEach((d) => {
        const data: any = d.data();
        const items: any[] = Array.isArray(data?.items) ? data.items : [];
        items.forEach((it) => {
          const key = String(it?.id ?? '');
          if (!key) return;
          const name = String(it?.name ?? 'Tanımsız');
          const price = Number.isFinite(it?.price) ? Number(it.price) : 0;
          const qty = Number.isFinite(it?.quantity) ? Number(it.quantity) : 0;
          if (!aggregate[key]) {
            aggregate[key] = { id: key, name, price, quantity: 0 };
          }
          aggregate[key].quantity += qty;
        });
        const note = typeof data?.orderNote === 'string' ? data.orderNote : '';
        if (note) combinedNoteParts.push(note);
      });

      const mergedItems: Item[] = Object.values(aggregate);
      combinedTotal = mergedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

      const sourceTableLabel = tables.find(t => String(t.id) === sourceTableId)?.name || sourceTableId;
      const targetTableLabel = tables.find(t => String(t.id) === targetId)?.name || targetId;
      const transferTag = `Taşındı: ${sourceTableLabel} → ${targetTableLabel}`;

      const batch = writeBatch(db);

      if (targetDoc) {
        // 3.a Mevcut hedefe merge
        const tgtData: any = targetDoc.data();
        const tgtItems: any[] = Array.isArray(tgtData?.items) ? tgtData.items : [];
        const map: Record<string, Item> = {};
        // hedef mevcutları ekle
        tgtItems.forEach((it: any) => {
          const key = String(it?.id ?? '');
          if (!key) return;
          map[key] = {
            id: key,
            name: String(it?.name ?? 'Tanımsız'),
            price: Number.isFinite(it?.price) ? Number(it.price) : 0,
            quantity: Number.isFinite(it?.quantity) ? Number(it.quantity) : 0,
          };
        });
        // kaynaklardan ekle
        mergedItems.forEach((it) => {
          if (!map[it.id]) {
            map[it.id] = { ...it };
          } else {
            map[it.id].quantity += it.quantity;
            // fiyatı mevcut hedef fiyatı ile bırakıyoruz; istenirse it.price ile yeniden hesaplanabilir
          }
        });
        const finalItems = Object.values(map);
        const finalTotal = finalItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
        const newNoteParts: string[] = [];
        const tgtNote = typeof tgtData?.orderNote === 'string' ? tgtData.orderNote : '';
        if (tgtNote) newNoteParts.push(tgtNote);
        if (combinedNoteParts.length) newNoteParts.push(combinedNoteParts.join(' | '));
        newNoteParts.push(transferTag);

        batch.update(doc(db, 'orders', targetDoc.id), {
          items: finalItems,
          totalPrice: finalTotal,
          orderNote: newNoteParts.join(' | '),
          timestamp: Timestamp.now(),
        });

        // Kaynakları kapat (paid) ve not düş
        sourceDocs.forEach((sd) => {
          batch.update(doc(db, 'orders', sd.id), {
            paymentStatus: 'paid',
            orderNote: `${transferTag} | ${(typeof sd.data()?.orderNote === 'string' && sd.data().orderNote) ? sd.data().orderNote : ''}`.trim(),
            timestamp: Timestamp.now(),
          });
        });
      } else {
        // 3.b Hedefte pending yoksa yeni birleştirilmiş sipariş oluştur
        const newOrder = {
          tableId: targetId,
          sessionId: '', // ayrı oturum gerekmiyor; boş bırakıyoruz
          items: mergedItems,
          status: 'new' as OrderStatus,
          totalPrice: combinedTotal,
          orderNote: [...combinedNoteParts, transferTag].filter(Boolean).join(' | '),
          timestamp: Timestamp.now(),
          paymentStatus: 'pending' as const,
        };
        const newRef = doc(collection(db, 'orders'));
        batch.set(newRef, newOrder);

        // Kaynakları kapat
        sourceDocs.forEach((sd) => {
          batch.update(doc(db, 'orders', sd.id), {
            paymentStatus: 'paid',
            orderNote: `${transferTag} | ${(typeof sd.data()?.orderNote === 'string' && sd.data().orderNote) ? sd.data().orderNote : ''}`.trim(),
            timestamp: Timestamp.now(),
          });
        });
      }

      await batch.commit();
      setIsTransferOpen(false);
      setTargetTableId('');
      setTransferLoading(false);
      alert('Masa taşıma işlemi başarıyla tamamlandı.');
    } catch (e) {
      console.error('Masa taşıma hatası:', e);
      setTransferLoading(false);
      setTransferError('Masa taşıma sırasında bir hata oluştu.');
    }
  };
  
  // Tarih formatı (adjust to handle Firestore Timestamp)
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to Date
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sipariş Yönetimi</h1>
        <a
          href="#/admin/order-history"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          Geçmiş Siparişler
        </a>
      </div>
      
      {/* Garson Çağrısı Bildirimleri */}
      <WaiterCallNotifications />
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sipariş Grid */}
        <div className="lg:w-2/3">
          <OrderGrid 
            orders={orders}
            onStatusUpdate={updateOrderStatus}
            onOrderSelect={setSelectedOrder}
          />
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

              {/* Masa Taşıma */}
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-blue-700 font-medium">Masa: {selectedOrder.tableId}</p>
                    <p className="text-blue-700 text-sm">{formatDate(selectedOrder.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setTargetTableId('');
                      setTransferError(null);
                      setIsTransferOpen(true);
                    }}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Masa Taşı
                  </button>
                </div>

                {isTransferOpen && (
                  <div className="mt-3 border border-blue-200 rounded-md p-3 bg-white">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Masa</label>
                    <select
                      value={targetTableId}
                      onChange={(e) => setTargetTableId(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    >
                      <option value="">Seçiniz</option>
                      {tables
                        .filter(t => String(t.id) !== selectedOrder.tableId)
                        .map(t => (
                          <option key={t.id} value={String(t.id)}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                    {transferError && (
                      <p className="text-rose-600 text-xs mt-2">{transferError}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleTransferOrders}
                        disabled={transferLoading}
                        className={`px-3 py-1 rounded-md text-xs font-medium ${transferLoading ? 'bg-gray-300 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                      >
                        {transferLoading ? 'Taşınıyor...' : 'Onayla'}
                      </button>
                      <button
                        onClick={() => { setIsTransferOpen(false); setTransferError(null); }}
                        disabled={transferLoading}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Ödeme Durumu */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">Ödeme Durumu</h3>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedOrder.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedOrder.paymentStatus === 'paid' ? 'Ödendi' : 'Ödenmedi'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await updateDoc(doc(db, 'orders', selectedOrder.id), { paymentStatus: 'pending' });
                          setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'pending' } : prev);
                        } catch (e) {
                          console.error(e);
                          alert('Ödeme durumu güncellenemedi.');
                        }
                      }}
                      disabled={selectedOrder.paymentStatus === 'pending'}
                      className={`px-3 py-1 rounded-md text-xs font-medium border ${
                        selectedOrder.paymentStatus === 'pending'
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Ödenmedi
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await updateDoc(doc(db, 'orders', selectedOrder.id), { paymentStatus: 'paid' });
                          setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'paid' } : prev);
                        } catch (e) {
                          console.error(e);
                          alert('Ödeme durumu güncellenemedi.');
                        }
                      }}
                      disabled={selectedOrder.paymentStatus === 'paid'}
                      className={`px-3 py-1 rounded-md text-xs font-medium border ${
                        selectedOrder.paymentStatus === 'paid'
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                      }`}
                    >
                      Ödendi
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">Sipariş Durumu</h3>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'preparing', 'ready', 'delivered'] as OrderStatus[]).map(status => {
                    const isActive = selectedOrder.status === status;
                    const statusInfo = getStatusInfo(status);
                    
                    return (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isActive
                            ? statusInfo.color
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {statusInfo.label}
                      </button>
                    );
                  })}
                </div>
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
                <span>{selectedOrder.totalPrice} ₺</span>
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

export default AdminOrdersPage;

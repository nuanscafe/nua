import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { db } from '../../firebase'; // Import the initialized Firestore instance
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'; // Import Firestore functions

const CheckoutPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();

  const handleSubmitOrder = async () => { // Make the function asynchronous
    try {
      // Get the order note from the textarea
      const orderNoteElement = document.getElementById('order-note') as HTMLTextAreaElement;
      const orderNote = orderNoteElement ? orderNoteElement.value : '';

      // Generate unique session ID
      const sessionId = crypto.randomUUID();

      // Normalize current cart items
      const currentItems = (Array.isArray(items) ? items : []).map(it => ({
        id: String(it?.id ?? ''),
        // name alanı bazı yerlerde name_tr olabilir; güvenli fallback verelim
        name: String((it as any)?.name ?? (it as any)?.name_tr ?? 'Tanımsız'),
        price: Number.isFinite(it?.price) ? Number(it.price) : 0,
        quantity: Number.isFinite(it?.quantity) ? Number(it.quantity) : 0,
      }));

      const tableIdSafe = typeof tableId === 'string' ? tableId : '';

      // Önce aynı masaya ait paymentStatus 'pending' olan açık bir hesap var mı kontrol et
      const ordersCol = collection(db, 'orders');
      const openQuery = query(
        ordersCol,
        where('tableId', '==', tableIdSafe),
        where('paymentStatus', '==', 'pending')
      );
      const openSnap = await getDocs(openQuery);

      if (!openSnap.empty) {
        // İlk açık hesabı seç ve birleştir
        const targetDoc = openSnap.docs[0];
        const targetData: any = targetDoc.data();

        // Hedefin mevcut öğelerini normalize et
        const targetItems = (Array.isArray(targetData?.items) ? targetData.items : [])
          .filter((it: any) => it && typeof it === 'object')
          .map((it: any) => ({
            id: String(it?.id ?? ''),
            name: String(it?.name ?? 'Tanımsız'),
            price: Number.isFinite(it?.price) ? Number(it.price) : 0,
            quantity: Number.isFinite(it?.quantity) ? Number(it.quantity) : 0,
          }));

        // Item bazında quantity topla
        const mergedMap = new Map<string, { id: string; name: string; price: number; quantity: number }>();
        for (const it of targetItems) {
          const key = String(it.id);
          mergedMap.set(key, { ...it });
        }
        for (const it of currentItems) {
          const key = String(it.id);
          const existing = mergedMap.get(key);
          if (existing) {
            mergedMap.set(key, { ...existing, quantity: (existing.quantity || 0) + (it.quantity || 0) });
          } else {
            mergedMap.set(key, { ...it });
          }
        }
        const mergedItems = Array.from(mergedMap.values());

        // Toplam fiyatı yeniden hesapla
        const newTotal = mergedItems.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);

        // Notu birleştir (mevcut not + ' | ' + yeni not) - boşlar yok sayılır
        const existingNote = typeof targetData?.orderNote === 'string' ? targetData.orderNote.trim() : '';
        const incomingNote = (orderNote ?? '').trim();
        const combinedNote =
          existingNote && incomingNote ? `${existingNote} | ${incomingNote}` :
          existingNote ? existingNote :
          incomingNote ? incomingNote : '';

        // Dokümanı güncelle
        await updateDoc(doc(db, 'orders', targetDoc.id), {
          items: mergedItems,
          totalPrice: newTotal,
          orderNote: combinedNote || null,
          // son aktiviteyi gösterecek şekilde timestamp güncelle
          timestamp: Timestamp.now(),
          // status korunur; paymentStatus zaten 'pending'
        });

        alert('Siparişiniz mevcut açık hesaba eklendi. Teşekkür ederiz.');
        clearCart();
        navigate(`/thank-you/${tableId}`);
        return;
      }

      // Açık hesap yoksa yeni order oluştur
      const orderData = {
        tableId: tableIdSafe,
        sessionId: typeof sessionId === 'string' ? sessionId : '',
        items: currentItems,
        totalPrice: Number.isFinite(getTotalPrice()) ? Number(getTotalPrice()) : 0,
        orderNote: orderNote ?? '',
        timestamp: Timestamp.now(), // Add a timestamp
        status: 'new' as const, // Initial status
        paymentStatus: 'pending' as const, // Add payment status
      };

      // Save the order to Firestore
      await addDoc(collection(db, 'orders'), orderData); // Assuming an "orders" collection

      alert('Siparişiniz alındı! Teşekkür ederiz.');
      clearCart();
      navigate(`/thank-you/${tableId}`);
    } catch (error: any) {
      console.error('Error submitting order:', error);
      const msg = typeof error?.message === 'string' ? error.message : String(error);
      alert(`Sipariş gönderilirken bir hata oluştu. Lütfen tekrar deneyin.\nDetay: ${msg}`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sepetiniz Boş</h1>
          <p className="text-gray-600 mb-4">Sipariş verebilmek için sepetinize ürün eklemelisiniz.</p>
          <button
            onClick={() => navigate(`/menu/${tableId}`)}
            className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Menüye Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Siparişi Tamamla</h1>

        {tableId && (
          <div className="mb-4 p-3 bg-amber-50 rounded-md">
            <p className="text-amber-700 font-medium">Masa: {tableId}</p>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Sipariş Özeti</h2>
          <div className="border-t border-b border-gray-200 py-4 divide-y divide-gray-200">
            {items.map(item => (
              <div key={item.id} className="py-3 flex justify-between">
                <div className="flex items-center">
                  <span className="text-gray-800">{item.quantity} x {item.name}</span>
                </div>
                <span className="text-gray-800 font-medium">{item.price * item.quantity} ₺</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center text-xl font-bold">
            <span>Toplam:</span>
            <span>{getTotalPrice()} ₺</span>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Sipariş Notu</h2>
          <textarea
            id="order-note" // Added id to easily get the value
            className="w-full border border-gray-300 rounded-md p-3 h-24 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Özel istekleriniz varsa buraya yazabilirsiniz..."
          ></textarea>
        </div>

        <button
          onClick={handleSubmitOrder}
          className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-md transition-colors text-lg font-medium"
        >
          Siparişi Onayla
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;

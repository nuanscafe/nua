import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '../../hooks/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { useTranslation } from 'react-i18next';

const AdminDashboard: React.FC = () => {
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchNewOrdersCount = async () => {
      try {
        const ordersCollection = collection(db, 'orders');
        // Assuming 'status' field exists and 'pending' indicates a new order
        const q = query(ordersCollection, where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        setNewOrdersCount(querySnapshot.size);
      } catch (error) {
        console.error('Error fetching new orders count:', error);
        toast({
          title: t('error'),
          description: t('errorFetchingNewOrdersCount'),
          variant: 'destructive',
        });
      }
    };

    fetchNewOrdersCount();
  }, [toast, t]); // Add t to dependency array

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('adminDashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Siparişler Kartı */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('orders')}</h2>
              <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold">
                {newOrdersCount} {t('new')}
              </div>
            </div>
            <p className="text-gray-600 mb-6">{t('viewActiveOrders')}</p>
            <Link 
              to="/admin/orders"
              className="block w-full bg-amber-500 hover:bg-amber-600 text-white text-center py-2 px-4 rounded-md transition-colors"
            >
              {t('manageOrders')}
            </Link>
          </div>
        </div>
        
        {/* Menü Yönetimi Kartı */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('menuManagement')}</h2>
            </div>
            <p className="text-gray-600 mb-6">{t('manageMenuDescription')}</p>
            <Link 
              to="/admin/menu"
              className="block w-full bg-amber-500 hover:bg-amber-600 text-white text-center py-2 px-4 rounded-md transition-colors"
            >
              {t('manageMenu')}
            </Link>
          </div>
        </div>
        
        {/* Geçmiş Siparişler Kartı */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Geçmiş Siparişler</h2>
            </div>
            <p className="text-gray-600 mb-6">Ödenen siparişleri görüntüle ve raporla</p>
            <Link 
              to="/admin/order-history"
              className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 px-4 rounded-md transition-colors"
            >
              Geçmiş Siparişler
            </Link>
          </div>
        </div>
        
        {/* QR Kodlar Kartı */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('qrCodes')}</h2>
            </div>
            <p className="text-gray-600 mb-6">{t('viewPrintQrCodes')}</p>
            <Link 
              to="/admin/qrcodes"
              className="block w-full bg-amber-500 hover:bg-amber-600 text-white text-center py-2 px-4 rounded-md transition-colors"
            >
              {t('viewQrCodes')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

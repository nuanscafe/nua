import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { WaiterCall } from '../../data/menuData';
import { playWaiterCallSound } from '../../utils/audioUtils';

const WaiterCallNotifications: React.FC = () => {
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [previousCallCount, setPreviousCallCount] = useState(0);

  useEffect(() => {
    const waiterCallsCollection = collection(db, 'waiterCalls');
    const waiterCallsQuery = query(
      waiterCallsCollection,
      where('status', 'in', ['pending', 'acknowledged']),
      orderBy('status'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(waiterCallsQuery, (snapshot) => {
      const callsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<WaiterCall, 'id'>
      }));

      // Play sound for new calls
      const pendingCalls = callsList.filter(call => call.status === 'pending');
      if (pendingCalls.length > 0 && previousCallCount !== 0) {
        playWaiterCallSound();
        showWaiterCallNotification();
      }

      setWaiterCalls(callsList);
      setPreviousCallCount(callsList.length);
    });

    return () => unsubscribe();
  }, [previousCallCount]);

  const showWaiterCallNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Garson Çağrısı!', {
        body: 'Bir masadan garson çağrısı var.',
        icon: '/favicon.ico'
      });
    }
  };

  const updateCallStatus = async (callId: string, newStatus: 'acknowledged' | 'resolved') => {
    try {
      const callRef = doc(db, 'waiterCalls', callId);
      await updateDoc(callRef, {
        status: newStatus
      });
    } catch (error) {
      console.error('Çağrı durumu güncellenirken hata oluştu:', error);
    }
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'acknowledged':
        return 'Görüldü';
      case 'resolved':
        return 'Çözüldü';
      default:
        return status;
    }
  };

  if (waiterCalls.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          🔔 Garson Çağrıları ({waiterCalls.length})
        </h3>
        {waiterCalls.some(call => call.status === 'pending') && (
          <div className="animate-pulse">
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              YENİ
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {waiterCalls.map(call => (
          <div
            key={call.id}
            className={`p-3 rounded-lg border-2 ${getStatusColor(call.status)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {call.tableId.replace('table-', 'Masa ')}
                </div>
                <div className="text-sm opacity-75">
                  {formatTime(call.timestamp)}
                </div>
                {call.message && (
                  <div className="text-sm mt-1">
                    {call.message}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                  {getStatusText(call.status)}
                </span>
                <div className="flex gap-1">
                  {call.status === 'pending' && (
                    <button
                      onClick={() => updateCallStatus(call.id, 'acknowledged')}
                      className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                    >
                      Gördüm
                    </button>
                  )}
                  {call.status !== 'resolved' && (
                    <button
                      onClick={() => updateCallStatus(call.id, 'resolved')}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Çözüldü
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaiterCallNotifications;

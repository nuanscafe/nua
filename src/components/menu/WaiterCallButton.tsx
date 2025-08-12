import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createWaiterCall } from '../../data/menuData';

interface WaiterCallButtonProps {
  tableId: string;
}

const WaiterCallButton: React.FC<WaiterCallButtonProps> = ({ tableId }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [lastCallTime, setLastCallTime] = useState<number | null>(null);

  const handleWaiterCall = async () => {
    // Prevent spam calls (minimum 30 seconds between calls)
    const now = Date.now();
    if (lastCallTime && now - lastCallTime < 30000) {
      const remaining = Math.ceil((30000 - (now - lastCallTime)) / 1000);
      alert(t('waiter_call.try_again_in_seconds', { count: remaining }));
      return;
    }

    setIsLoading(true);
    try {
      await createWaiterCall(tableId, t('waiter_call.message_default'));
      setLastCallTime(now);
      alert(t('waiter_call.sent_success'));
    } catch (error) {
      console.error('Garson çağrısı gönderilirken hata oluştu:', error);
      alert(t('waiter_call.sent_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleWaiterCall}
      disabled={isLoading}
      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
        isLoading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}
    >
      {isLoading ? t('waiter_call.sending') : `🔔 ${t('waiter_call.button')}`}
    </button>
  );
};

export default WaiterCallButton;
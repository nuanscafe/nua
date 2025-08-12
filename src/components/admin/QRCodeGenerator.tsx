import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { tables } from '../../data/menuData';

const QRCodeGenerator: React.FC = () => {
const navigate = useNavigate();
// QR URL'lerini dağıtım/hedef ortama göre dinamik üret
// Vite BASE_URL: prod'da /nua/, dev/preview'da /
const appBase = (import.meta as any).env?.BASE_URL ?? '/';
const normalizedBase = appBase.endsWith('/') ? appBase : `${appBase}/`;
// HashRouter ile çalışacak tam QR tabanı: https://domain/base/#/menu/...
const qrBase = `${window.location.origin}${normalizedBase}#`;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-amber-800 mb-6 text-center">Masa QR Kodları</h1>
      <p className="text-gray-600 mb-8 text-center">
        Her masa için QR kodları aşağıda listelenmiştir. Bu kodları yazdırıp masalara yerleştirebilirsiniz.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{table.name}</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <QRCodeSVG 
                value={`${qrBase}/menu/${table.qrCode}`}
                size={180} 
                bgColor={"#ffffff"} 
                fgColor={"#000000"} 
                level={"H"} 
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              URL: {`${qrBase}/menu/${table.qrCode}`}
            </p>
            <button
              onClick={() => navigate(`/menu/${table.qrCode}`)}
              className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Menüyü Görüntüle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRCodeGenerator;

# Implementation Plan

- [x] 1. Masa sayısını 8'den 20'ye çıkar



  - menuData.ts dosyasındaki tables array'ini 20 masaya genişlet
  - QR kod üretiminin 20 masa için çalıştığını doğrula



  - _Requirements: 1.1, 1.2, 1.3_




- [x] 2. Garson çağırma sistemi için Firestore koleksiyonu oluştur

  - WaiterCall interface'ini tanımla
  - Firestore'da waiterCalls koleksiyonu için veri yapısını hazırla



  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Müşteri tarafında garson çağırma butonu ekle

  - WaiterCallButton bileşenini oluştur



  - MenuPage.tsx'e garson çağırma butonunu entegre et
  - Firestore'a garson çağrısı kaydetme fonksiyonunu implement et
  - _Requirements: 2.1_





- [ ] 4. Admin panelde garson çağrısı bildirimleri sistemi ekle
  - WaiterCallNotifications bileşenini oluştur

  - Real-time garson çağrısı dinleyicisi implement et
  - Ses uyarısı çalma fonksiyonunu ekle
  - AdminOrdersPage.tsx'e bildirim sistemini entegre et
  - _Requirements: 2.2, 2.3, 2.4_


- [ ] 5. Admin sipariş yönetimini kart tabanlı tasarıma dönüştür
  - OrderCard bileşenini oluştur (masa kartları için)
  - OrderGrid bileşenini oluştur (kart layout için)
  - Mevcut tablo görünümünü kart görünümü ile değiştir
  - _Requirements: 3.1_


- [ ] 6. Sipariş durumu renk kodlaması ve ses bildirimleri ekle

  - Yeni sipariş geldiğinde ses çalma fonksiyonunu implement et
  - Sipariş durumuna göre masa kartı renk değişimini ekle
  - Sipariş verildiğinde yeşil, ödeme yapıldığında gri renk sistemi
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 7. Aynı masadan gelen farklı siparişleri ayırt etme sistemi ekle


  - Order interface'ine sessionId alanı ekle
  - Her yeni sipariş için unique session ID üretme sistemi
  - Aynı masanın farklı session'larını ayrı gösterme
  - _Requirements: 3.5, 3.6_

- [x] 8. Müşteri tarafında sabit sepet bileşeni oluştur


  - FloatingCart bileşenini oluştur
  - CartSummary bileşenini oluştur
  - Sepet görünürlük yönetimi için hook oluştur
  - _Requirements: 4.1, 4.4_

- [x] 9. Sepet real-time güncellemelerini implement et

  - Ürün eklendiğinde sepette anında gösterme
  - Ürün çıkarıldığında sepeti anında güncelleme
  - Toplam tutar hesaplamasını real-time yapma
  - _Requirements: 4.2, 4.3, 4.5_

- [x] 10. MenuPage.tsx'e FloatingCart bileşenini entegre et



  - Mevcut CartContext ile FloatingCart'ı bağla
  - Sepet boş olduğunda gizleme/gösterme mantığı
  - Mobile responsive tasarım kontrolü
  - _Requirements: 4.1, 4.4_

- [x] 11. Ses dosyalarını projeye ekle ve ses sistemi kur


  - public/sounds/ klasörü oluştur
  - Garson çağrısı ve yeni sipariş ses dosyalarını ekle
  - Audio context yönetimi ve browser uyumluluğu
  - _Requirements: 2.2, 3.2_

- [ ] 12. Tüm değişiklikleri test et ve entegrasyon kontrolü yap
  - 20 masa için QR kodlarının çalıştığını test et
  - Garson çağırma sisteminin end-to-end testini yap
  - Admin paneldeki yeni tasarımın fonksiyonelliğini kontrol et
  - Müşteri sepet deneyiminin sorunsuz çalıştığını doğrula
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5_
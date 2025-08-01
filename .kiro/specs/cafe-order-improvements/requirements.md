# Requirements Document

## Introduction

Bu özellik, mevcut cafe QR sipariş sisteminde kullanıcı deneyimini ve yönetim panelini iyileştirmek için tasarlanmıştır. Sistem şu anda 8 masa ile çalışmakta olup, masa sayısının 20'ye çıkarılması, garson çağırma özelliği eklenmesi, admin panelinin modernleştirilmesi ve müşteri sepet görünümünün iyileştirilmesi hedeflenmektedir.

## Requirements

### Requirement 1

**User Story:** Cafe yöneticisi olarak, daha fazla müşteriye hizmet verebilmek için masa sayısını artırmak istiyorum.

#### Acceptance Criteria

1. WHEN sistem başlatıldığında THEN sistem 20 masa için QR kodları oluşturabilmeli
2. WHEN QR kod sayfası açıldığında THEN 20 masa için QR kodları görüntülenmeli
3. WHEN müşteri herhangi bir masa QR kodunu taradığında THEN doğru masa ID'si ile menü sayfası açılmalı

### Requirement 2

**User Story:** Müşteri olarak, masada oturduğumda garson çağırabilmek istiyorum.

#### Acceptance Criteria

1. WHEN müşteri masa QR kodunu taradığında THEN menü sayfasında "Garson Çağır" butonu görünmeli
2. WHEN müşteri "Garson Çağır" butonuna bastığında THEN admin panelde ses uyarısı çalmalı
3. WHEN garson çağrısı yapıldığında THEN admin panelde hangi masadan çağrı geldiği görünmeli
4. WHEN garson çağrısı admin tarafından görüldüğünde THEN çağrı durumu güncellenebilmeli

### Requirement 3

**User Story:** Cafe yöneticisi olarak, sipariş yönetimini daha estetik ve kullanışlı bir şekilde görmek istiyorum.

#### Acceptance Criteria

1. WHEN admin sipariş yönetimi sayfasını açtığında THEN masalar kart/kutu formatında görünmeli
2. WHEN yeni sipariş geldiğinde THEN sipariş bildirimi sesi çalmalı
3. WHEN sipariş verildiğinde THEN masa kartının rengi yeşile dönmeli
4. WHEN hesap ödendiğinde THEN masa kartının rengi eski haline gelmeli
5. WHEN aynı masadan birden fazla sipariş geldiğinde THEN her sipariş ayrı ayrı değerlendirilmeli
6. WHEN masa kartına tıklandığında THEN o masanın tüm aktif siparişleri görünmeli

### Requirement 4

**User Story:** Müşteri olarak, sipariş verirken sepetimi daha görünür bir yerde görmek istiyorum.

#### Acceptance Criteria

1. WHEN müşteri menü sayfasında olduğunda THEN sepet sayfanın alt kısmında sabit olarak görünmeli
2. WHEN müşteri ürün eklediğinde THEN sepette eklenen ürün anında görünmeli
3. WHEN müşteri sepeti açtığında THEN tüm eklenen ürünler ve toplam tutar net şekilde görünmeli
4. WHEN sepet boş olduğunda THEN sepet alanı gizli olmalı veya boş durumu belirtmeli
5. WHEN müşteri sepetten ürün çıkardığında THEN sepet anında güncellenmelidir
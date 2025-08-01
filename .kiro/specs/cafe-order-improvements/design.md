# Design Document

## Overview

Bu tasarım, mevcut React + Firebase tabanlı cafe QR sipariş sisteminde dört ana iyileştirme gerçekleştirecektir:
1. Masa sayısının 8'den 20'ye çıkarılması
2. Garson çağırma sistemi eklenmesi
3. Admin panelinin modernleştirilmesi
4. Müşteri sepet deneyiminin iyileştirilmesi

Sistem mevcut Firebase Firestore veritabanı, React Router, Context API ve Tailwind CSS teknolojilerini kullanmaya devam edecektir.

## Architecture

### Current System Components
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Firebase Firestore (NoSQL database)
- **State Management**: React Context API (CartContext)
- **Routing**: React Router DOM
- **UI Components**: Radix UI + Custom components

### New Components to be Added
- **WaiterCallSystem**: Garson çağırma sistemi
- **ModernOrderManagement**: Yenilenmiş sipariş yönetimi
- **FloatingCart**: Sabit sepet bileşeni
- **NotificationSystem**: Ses bildirimleri sistemi

## Components and Interfaces

### 1. Table Management Enhancement

**Modified Interface:**
```typescript
interface Table {
  id: number;
  name: string;
  qrCode: string;
}

// 20 masa için genişletilmiş tables array
export const tables: Table[] = [
  { id: 1, name: 'Masa 1', qrCode: 'table-1' },
  // ... 20 masaya kadar
];
```

**Files to Modify:**
- `src/data/menuData.ts`: tables array'ini 20 masaya çıkar

### 2. Waiter Call System

**New Firestore Collection:**
```typescript
interface WaiterCall {
  id: string;
  tableId: string;
  timestamp: Timestamp;
  status: 'pending' | 'acknowledged' | 'resolved';
  message?: string;
}
```

**New Components:**
- `src/components/menu/WaiterCallButton.tsx`: Müşteri tarafında garson çağırma butonu
- `src/components/admin/WaiterCallNotifications.tsx`: Admin panelde bildirimler
- `src/hooks/useWaiterCalls.ts`: Garson çağrıları için custom hook

**Integration Points:**
- MenuPage.tsx: WaiterCallButton bileşenini ekle
- AdminOrdersPage.tsx: WaiterCallNotifications bileşenini ekle

### 3. Modern Order Management

**Enhanced Order Interface:**
```typescript
interface EnhancedOrder extends Order {
  sessionId: string; // Aynı masadan gelen farklı siparişleri ayırt etmek için
  paymentStatus: 'pending' | 'paid';
}
```

**New Components:**
- `src/components/admin/OrderCard.tsx`: Masa kartları için yeni bileşen
- `src/components/admin/OrderGrid.tsx`: Kart grid layout
- `src/hooks/useOrderNotifications.ts`: Sipariş bildirimleri için hook

**Visual Design:**
- Kart tabanlı layout (CSS Grid)
- Durum bazlı renk kodlaması:
  - Gri: Boş masa
  - Yeşil: Aktif sipariş
  - Mavi: Ödeme bekliyor
- Hover efektleri ve animasyonlar

### 4. Floating Cart Component

**New Component:**
```typescript
interface FloatingCartProps {
  isVisible: boolean;
  onToggle: () => void;
}
```

**Files to Create:**
- `src/components/menu/FloatingCart.tsx`: Ana sepet bileşeni
- `src/components/menu/CartSummary.tsx`: Sepet özeti
- `src/hooks/useCartVisibility.ts`: Sepet görünürlüğü yönetimi

**Integration:**
- MenuPage.tsx: FloatingCart bileşenini ekle
- CartContext.tsx: Yeni metodlar ekle

## Data Models

### 1. Extended Tables Data
```typescript
// src/data/menuData.ts
export const tables: Table[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Masa ${i + 1}`,
  qrCode: `table-${i + 1}`
}));
```

### 2. Waiter Calls Collection
```typescript
// Firestore: waiterCalls collection
{
  tableId: string,
  timestamp: Timestamp,
  status: 'pending' | 'acknowledged' | 'resolved',
  message?: string
}
```

### 3. Enhanced Orders Collection
```typescript
// Firestore: orders collection (enhanced)
{
  // Existing fields...
  sessionId: string, // UUID for session tracking
  paymentStatus: 'pending' | 'paid',
  tableNumber: number // For easier querying
}
```

## Error Handling

### 1. Network Errors
- Offline durumunda local storage kullanımı
- Retry mekanizması Firebase işlemleri için
- User-friendly error messages

### 2. Audio Notifications
- Browser audio policy handling
- Fallback visual notifications
- Volume control settings

### 3. Real-time Updates
- Connection loss handling
- Automatic reconnection
- Data synchronization

## Testing Strategy

### 1. Unit Tests
- Component rendering tests
- Context API functionality
- Utility functions
- Custom hooks

### 2. Integration Tests
- Firebase operations
- Real-time listeners
- Audio notifications
- Cart functionality

### 3. E2E Tests
- Complete order flow
- Admin panel operations
- Multi-table scenarios
- Waiter call system

## Performance Considerations

### 1. Real-time Listeners
- Efficient Firestore queries with proper indexing
- Unsubscribe cleanup in useEffect
- Debounced updates for frequent changes

### 2. Audio Management
- Lazy loading of audio files
- Audio context management
- Memory cleanup

### 3. Component Optimization
- React.memo for expensive components
- useMemo for complex calculations
- Proper dependency arrays

## Security Considerations

### 1. Firestore Rules
```javascript
// Enhanced security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow read, write: if true; // Adjust based on auth requirements
    }
    match /waiterCalls/{callId} {
      allow read, write: if true;
    }
  }
}
```

### 2. Input Validation
- Client-side validation for all forms
- Sanitization of user inputs
- Rate limiting for waiter calls

## Implementation Phases

### Phase 1: Table Extension
- Update tables data to 20 tables
- Test QR code generation
- Verify routing works for all tables

### Phase 2: Waiter Call System
- Create Firestore collection
- Implement customer-side button
- Add admin notifications
- Implement audio alerts

### Phase 3: Modern Order Management
- Redesign admin orders page
- Implement card-based layout
- Add session tracking
- Implement payment status

### Phase 4: Floating Cart
- Create floating cart component
- Integrate with existing cart context
- Add animations and transitions
- Test mobile responsiveness

## Technical Specifications

### Audio Files
- Format: MP3 or WAV
- Location: `public/sounds/`
- Files needed:
  - `waiter-call.mp3`: Garson çağrısı sesi
  - `new-order.mp3`: Yeni sipariş sesi

### CSS Classes (Tailwind)
```css
/* Order status colors */
.order-new { @apply bg-blue-100 border-blue-300; }
.order-preparing { @apply bg-yellow-100 border-yellow-300; }
.order-ready { @apply bg-green-100 border-green-300; }
.order-paid { @apply bg-gray-100 border-gray-300; }

/* Floating cart */
.floating-cart { @apply fixed bottom-4 right-4 z-50; }
.cart-slide-up { @apply transform translate-y-0 transition-transform; }
```

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly button sizes (min 44px)
- Optimized for tablet use in admin panel
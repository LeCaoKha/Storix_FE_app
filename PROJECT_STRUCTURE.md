# Storix FE App - Project Structure

## 📁 Cấu trúc dự án

```
Storix_FE_app/
├── app/                    # Expo Router - File-based routing
│   ├── (manager-tabs)/     # Manager tab navigation
│   ├── (staff-tabs)/       # Staff tab navigation
│   ├── manager/            # Manager-specific routes
│   ├── staff/              # Staff-specific routes
│   └── _layout.tsx         # Root layout
│
├── components/             # Reusable UI Components
│   ├── ui/                 # Base UI components
│   │   ├── Card.tsx
│   │   ├── SafeAreaHeader.tsx
│   │   ├── TaskCard.tsx
│   │   └── HorizontalFilterBar.tsx
│   ├── requisitions/       # Requisition-specific components
│   │   ├── ItemList.tsx
│   │   ├── RequisitionCard.tsx
│   │   └── StatusBadge.tsx
│   ├── Button.tsx
│   ├── Input.tsx
│   └── index.ts            # Barrel export
│
├── features/               # Feature modules (UI/Screens only)
│   ├── manager/
│   │   ├── orders/         # Manager order screens
│   │   └── requisitions/   # Manager requisition screens
│   ├── staff/
│   │   ├── home/
│   │   ├── orders/
│   │   └── tasks/
│   └── share/              # Shared screens
│       ├── auth/
│       └── profile/
│
├── hooks/                  # Custom React Hooks
│   ├── auth.hooks.ts
│   ├── requisition.hooks.ts
│   ├── product.hooks.ts
│   ├── use-color-scheme.ts
│   └── index.ts
│
├── services/               # API Services & HTTP Requests
│   ├── auth.api.ts
│   ├── requisition.api.ts
│   ├── product.api.ts
│   ├── task.api.ts
│   ├── axios.instance.ts
│   ├── queryClient.ts
│   └── index.ts
│
├── stores/                 # Global State Management (Zustand)
│   └── auth.store.ts
│
├── types/                  # TypeScript Type Definitions
│   ├── auth.types.ts
│   ├── order.ts
│   ├── inbound-order.ts
│   ├── outbound-order.ts
│   ├── requisition.ts
│   ├── warehouse.ts
│   ├── scanning.ts
│   └── index.ts
│
├── contexts/               # React Contexts
│   ├── InboundOrderContext.tsx
│   ├── OutboundOrderContext.tsx
│   └── RequisitionContext.tsx
│
├── constants/              # App Constants
│   ├── color.ts
│   └── theme.ts
│
├── mock/                   # Mock Data for Development
│   ├── inbound-orders.ts
│   ├── outbound-orders.ts
│   └── requisitions.ts
│
└── assets/                 # Static Assets
    └── images/
```

## 🎯 Nguyên tắc tổ chức

### 1. **Tách biệt rõ ràng trách nhiệm**

- **`features/`**: Chỉ chứa UI/Screen components
- **`hooks/`**: Custom React hooks và business logic
- **`services/`**: API calls và HTTP requests
- **`stores/`**: Global state management
- **`types/`**: TypeScript type definitions

### 2. **Import paths sạch sẽ**

```typescript
// Components
import { Button, Card, Input } from '@/components';

// Hooks
import { useLogin, useLogout } from '@/hooks/auth.hooks';

// Services
import { loginRequest } from '@/services/auth.api';

// Types
import { User, InboundOrder } from '@/types';

// Stores
import { useAuthStore } from '@/stores/auth.store';

// Constants
import { Colors, COLORS } from '@/constants/color';
```

### 3. **Barrel Exports**

Mỗi thư mục có `index.ts` để export tập trung:

```typescript
// components/index.ts
export { Button } from './Button';
export { Card } from './ui/Card';

// hooks/index.ts
export * from './auth.hooks';
export * from './requisition.hooks';

// services/index.ts
export * from './auth.api';
export * from './requisition.api';

// types/index.ts
export * from './auth.types';
export * from './order';
```

## 📦 Module Organization

### **Features (UI Layer)**
Chỉ chứa React components cho screens:
- Manager screens
- Staff screens  
- Shared screens (Auth, Profile)

### **Hooks (Business Logic)**
Custom hooks xử lý:
- Data fetching với React Query
- Business logic
- Side effects

### **Services (Data Layer)**
API services:
- HTTP requests
- Axios configuration
- API endpoints

### **Stores (State Layer)**
Global state với Zustand:
- Authentication state
- User preferences
- Shared application state

### **Types (Type Definitions)**
TypeScript types cho:
- Entities (User, Order, Requisition)
- API responses
- Component props

## 🔄 Data Flow

```
UI (features/) 
  ↓ uses
Hooks (hooks/)
  ↓ calls
Services (services/)
  ↓ updates
Stores (stores/)
  ↓ provides
UI (features/)
```

## ✨ Lợi ích

1. **Dễ tìm kiếm**: Biết rõ file nằm ở đâu theo chức năng
2. **Dễ bảo trì**: Tách biệt concerns rõ ràng
3. **Dễ test**: Logic tách riêng khỏi UI
4. **Dễ scale**: Thêm features mới không ảnh hưởng cũ
5. **Type-safe**: TypeScript paths được cấu hình đầy đủ
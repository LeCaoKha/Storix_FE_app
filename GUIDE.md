# 📖 Hướng Dẫn Sử Dụng - Storix FE

## 🎯 Quy tắc vàng: Đâu là đâu?

### 📁 **hooks/** - Lấy data từ API
```typescript
// ✅ Dùng hooks để fetch data
import { useInboundOrders, useInboundOrder } from '@/hooks';

function MyScreen() {
  const { data, isLoading, error } = useInboundOrders();
  const { data: order } = useInboundOrder('123');
}
```

### 📁 **stores/** - Lưu trữ global state (persist)
```typescript
// ✅ Dùng stores cho auth, preferences
import { useAuthStore, usePreferencesStore } from '@/stores';

function MyComponent() {
  const { user, token, logout } = useAuthStore();
  const { theme, setTheme } = usePreferencesStore();
}
```

### 📁 **useState** - UI state trong component
```typescript
// ✅ Dùng useState cho UI state local
function MyForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
}
```

---

## 🔄 Khi nào dùng cái gì?

| Loại Data | Dùng gì | Ví dụ |
|-----------|---------|-------|
| Data từ API | **hooks/** (React Query) | Orders, Products, Users |
| Global state cần lưu | **stores/** (Zustand) | Auth, Theme, Language |
| UI state local | **useState** | Modal open/close, Form input |

---

## 📝 Examples

### 1. Fetch data từ API

```typescript
// features/manager/orders/InboundOrdersScreen.tsx
import { useInboundOrders } from '@/hooks';

export default function InboundOrdersScreen() {
  // ✅ React Query tự động cache, refetch
  const { data: orders = [], isLoading, error } = useInboundOrders();
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <OrderList orders={orders} />;
}
```

### 2. Create/Update data

```typescript
import { useCreateInboundOrder, useUpdateInboundOrder } from '@/hooks';

export default function CreateOrderScreen() {
  const createOrder = useCreateInboundOrder();
  const updateOrder = useUpdateInboundOrder();
  
  const handleSubmit = async (data) => {
    try {
      // ✅ Mutation tự động invalidate cache
      await createOrder.mutateAsync(data);
      router.back();
    } catch (error) {
      alert('Error creating order');
    }
  };
}
```

### 3. Auth state (global + persist)

```typescript
import { useAuthStore } from '@/stores';

export default function ProfileScreen() {
  // ✅ Store persist data sau khi close app
  const { user, logout } = useAuthStore();
  
  return (
    <View>
      <Text>{user?.email}</Text>
      <Button onPress={logout} title="Logout" />
    </View>
  );
}
```

### 4. UI preferences (global + persist)

```typescript
import { usePreferencesStore } from '@/stores';

export default function SettingsScreen() {
  // ✅ Theme/language được lưu vĩnh viễn
  const { theme, setTheme, language, setLanguage } = usePreferencesStore();
  
  return (
    <View>
      <Button onPress={() => setTheme('dark')} title="Dark Mode" />
      <Button onPress={() => setLanguage('en')} title="English" />
    </View>
  );
}
```

### 5. Local UI state

```typescript
import { useState } from 'react';

export default function SearchBar() {
  // ✅ Chỉ component này dùng, không cần global
  const [searchText, setSearchText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <TextInput 
      value={searchText} 
      onChangeText={setSearchText} 
    />
  );
}
```

---

## 🚫 ĐỪNG BAO GIỜ

### ❌ Đừng dùng Context cho API data
```typescript
// ❌ WRONG - Context làm chậm app
const OrderContext = createContext();

// ✅ RIGHT - Dùng React Query hooks
const { data } = useInboundOrders();
```

### ❌ Đừng lưu API data vào Store
```typescript
// ❌ WRONG - Store không nên lưu server data
const useOrderStore = create((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
}));

// ✅ RIGHT - React Query tự động manage
const { data: orders } = useInboundOrders();
```

### ❌ Đừng dùng Store cho UI state local
```typescript
// ❌ WRONG - Overkill cho modal state
const useModalStore = create((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
}));

// ✅ RIGHT - useState là đủ
const [isOpen, setIsOpen] = useState(false);
```

---

## 📂 Import paths

```typescript
// Components
import { Button, Card, Input } from '@/components';

// Hooks (React Query)
import { useInboundOrders, useLogin } from '@/hooks';

// Stores (Zustand)
import { useAuthStore, usePreferencesStore } from '@/stores';

// Types
import { InboundOrder, User } from '@/types';

// Constants
import { Colors, COLORS } from '@/constants/color';
```

---

## ✨ Benefits

1. **Performance**: React Query cache & auto refetch
2. **Clean code**: Mỗi thứ có chỗ riêng
3. **Persist**: Zustand lưu data sau khi close app
4. **Type-safe**: TypeScript full support
5. **Easy debug**: Biết rõ data đang ở đâu
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ItemCategory {
  id: string;
  branch: string;
  branch_name: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  category: string;
  category_name: string;
  name: string;
  description: string;
  size: string;
  total_stock: number;       // read-only — auto-calculated by backend
  reorder_level: number;
  unit_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string;
  item: string;
  item_name: string;
  transaction_type: "purchase" | "allocation" | "return" | "damage" | "adjustment";
  transaction_type_display: string;
  quantity: number;
  unit_price: string;
  reference: string;
  notes: string;
  created_at: string;
}

export interface ItemAllocation {
  id: string;
  item: string;
  item_name: string;
  student: string | null;
  student_name: string | null;
  faculty: string | null;
  faculty_name: string | null;
  sales_user: string | null;
  sales_user_name: string | null;
  quantity: number;
  status: "issued" | "returned" | "lost" | "damaged";
  status_display: string;
  issued_at: string;
  issued_by: string | number;
  issued_by_name: string;
  returned_at: string | null;
  return_notes: string;
  notes: string;
}

export interface ForecastItem {
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  reorder_level: number;
  last_30d_usage: number;
  daily_burn_rate: number;
  projected_30d_demand: number;
  days_until_stockout: number;
  status: "healthy" | "warning" | "critical";
  message: string;
}

// User shape from /api/auth/users/
export interface UserOption {
  id: string;
  name: string;
  role: string;
  email?: string;
  role_display?: string;
  is_active?: boolean;
}

interface InventoryState {
  categories: ItemCategory[];
  categoriesCount: number;
  categoriesLoading: boolean;

  items: InventoryItem[];
  itemsCount: number;
  itemsLoading: boolean;

  transactions: StockTransaction[];
  transactionsLoading: boolean;

  allocations: ItemAllocation[];
  allocationsCount: number;
  allocationsLoading: boolean;

  forecast: ForecastItem[];
  forecastLoading: boolean;

  error: string | null;
}

const initialState: InventoryState = {
  categories: [],
  categoriesCount: 0,
  categoriesLoading: false,

  items: [],
  itemsCount: 0,
  itemsLoading: false,

  transactions: [],
  transactionsLoading: false,

  allocations: [],
  allocationsCount: 0,
  allocationsLoading: false,

  forecast: [],
  forecastLoading: false,

  error: null,
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    // Categories
    setCategories(s, a: PayloadAction<{ data: ItemCategory[]; count: number }>) {
      s.categories = a.payload.data;
      s.categoriesCount = a.payload.count;
    },
    setCategoriesLoading(s, a: PayloadAction<boolean>) { s.categoriesLoading = a.payload; },
    addCategory(s, a: PayloadAction<ItemCategory>) { s.categories.unshift(a.payload); s.categoriesCount += 1; },
    updateCategoryInList(s, a: PayloadAction<ItemCategory>) {
      const i = s.categories.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.categories[i] = a.payload;
    },
    removeCategory(s, a: PayloadAction<string>) {
      s.categories = s.categories.filter(x => x.id !== a.payload);
      s.categoriesCount -= 1;
    },

    // Items
    setItems(s, a: PayloadAction<{ data: InventoryItem[]; count: number }>) {
      s.items = a.payload.data;
      s.itemsCount = a.payload.count;
    },
    setItemsLoading(s, a: PayloadAction<boolean>) { s.itemsLoading = a.payload; },
    addItem(s, a: PayloadAction<InventoryItem>) { s.items.unshift(a.payload); s.itemsCount += 1; },
    updateItemInList(s, a: PayloadAction<InventoryItem>) {
      const i = s.items.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.items[i] = a.payload;
    },
    removeItem(s, a: PayloadAction<string>) {
      s.items = s.items.filter(x => x.id !== a.payload);
      s.itemsCount -= 1;
    },

    // Transactions
    setTransactions(s, a: PayloadAction<StockTransaction[]>) { s.transactions = a.payload; },
    setTransactionsLoading(s, a: PayloadAction<boolean>) { s.transactionsLoading = a.payload; },
    addTransaction(s, a: PayloadAction<StockTransaction>) { s.transactions.unshift(a.payload); },

    // Allocations
    setAllocations(s, a: PayloadAction<{ data: ItemAllocation[]; count: number }>) {
      s.allocations = a.payload.data;
      s.allocationsCount = a.payload.count;
    },
    setAllocationsLoading(s, a: PayloadAction<boolean>) { s.allocationsLoading = a.payload; },
    addAllocation(s, a: PayloadAction<ItemAllocation>) { s.allocations.unshift(a.payload); s.allocationsCount += 1; },
    addAllocations(s, a: PayloadAction<ItemAllocation[]>) {
      s.allocations.unshift(...a.payload);
      s.allocationsCount += a.payload.length;
    },
    updateAllocationInList(s, a: PayloadAction<ItemAllocation>) {
      const i = s.allocations.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.allocations[i] = a.payload;
    },

    // Forecast
    setForecast(s, a: PayloadAction<ForecastItem[]>) { s.forecast = a.payload; },
    setForecastLoading(s, a: PayloadAction<boolean>) { s.forecastLoading = a.payload; },

    setInventoryError(s, a: PayloadAction<string>) { s.error = a.payload; },
  },
});

export const {
  setCategories, setCategoriesLoading, addCategory, updateCategoryInList, removeCategory,
  setItems, setItemsLoading, addItem, updateItemInList, removeItem,
  setTransactions, setTransactionsLoading, addTransaction,
  setAllocations, setAllocationsLoading, addAllocation, addAllocations, updateAllocationInList,
  setForecast, setForecastLoading,
  setInventoryError,
} = inventorySlice.actions;

export default inventorySlice.reducer;

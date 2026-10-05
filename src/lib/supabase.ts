import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { MenuItem, Order, AppSettings, CartBowl } from '../types';
import { DEFAULT_MENU_ITEMS, DEFAULT_APP_SETTINGS, generateRealisticOrders } from './mockData';
import { 
  cacheMenuItemsLocally, 
  getCachedMenuItems, 
  queueOfflineOrder, 
  getPendingOfflineOrders, 
  removePendingOfflineOrder,
  getLocalOrders,
  saveLocalOrder,
  bulkSaveLocalOrders
} from './idb';
import { getKolkataDateString } from './formatters';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// High-speed In-Memory Cache for ultra-fast 0ms responses
let memoryOrdersCache: Order[] | null = null;
let memoryMenuCache: MenuItem[] | null = null;
let isInitializing = false;

// Event emitter for local realtime simulations
type RealtimeCallback = (payload: { eventType: string; new: any; old: any }) => void;
const localSubscribers: Set<RealtimeCallback> = new Set();

export function subscribeToOrders(callback: RealtimeCallback): () => void {
  if (supabase) {
    const channel: RealtimeChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } else {
    localSubscribers.add(callback);
    return () => {
      localSubscribers.delete(callback);
    };
  }
}

function notifyLocalRealtime(eventType: string, record: any, oldRecord?: any) {
  localSubscribers.forEach((cb) => cb({ eventType, new: record, old: oldRecord }));
}

function runBackground(promiseLike: PromiseLike<any>): void {
  promiseLike.then(undefined, () => {});
}

/**
 * High-level API Adapter with in-memory caching for sub-10ms response times
 */
export const apiClient = {
  isOnline: (): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  // Initialize data once at startup
  initData: async (): Promise<void> => {
    if (memoryOrdersCache && memoryOrdersCache.length > 0) return;
    if (isInitializing) return;
    isInitializing = true;

    try {
      // 1. Load menu into memory
      const cachedMenu = await getCachedMenuItems();
      if (cachedMenu && cachedMenu.length > 0) {
        memoryMenuCache = cachedMenu;
      } else {
        memoryMenuCache = DEFAULT_MENU_ITEMS;
        cacheMenuItemsLocally(DEFAULT_MENU_ITEMS).catch(() => {});
      }

      // 2. Load orders into memory
      const local = await getLocalOrders();
      if (local && local.length > 0) {
        memoryOrdersCache = local;
      } else {
        const seed = generateRealisticOrders(30);
        memoryOrdersCache = seed;
        bulkSaveLocalOrders(seed).catch(() => {});
      }
    } finally {
      isInitializing = false;
    }
  },

  // 1. MENU ITEMS (Instant memory response)
  getMenuItems: async (): Promise<MenuItem[]> => {
    if (memoryMenuCache && memoryMenuCache.length > 0) {
      return memoryMenuCache;
    }

    if (supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) {
          memoryMenuCache = data;
          cacheMenuItemsLocally(data).catch(() => {});
          return data;
        }
      } catch (e) {
        // Fallback to cache
      }
    }

    const cached = await getCachedMenuItems();
    if (cached.length > 0) {
      memoryMenuCache = cached;
      return cached;
    }
    memoryMenuCache = DEFAULT_MENU_ITEMS;
    return DEFAULT_MENU_ITEMS;
  },

  updateMenuItem: async (item: MenuItem): Promise<MenuItem> => {
    if (memoryMenuCache) {
      memoryMenuCache = memoryMenuCache.map((m) => (m.id === item.id ? item : m));
    }

    // Persist asynchronously
    cacheMenuItemsLocally(memoryMenuCache || [item]).catch(() => {});

    if (supabase && navigator.onLine) {
      runBackground(supabase.from('menu_items').upsert(item));
    }

    return item;
  },

  saveMenuItems: async (items: MenuItem[]): Promise<void> => {
    memoryMenuCache = items;
    cacheMenuItemsLocally(items).catch(() => {});
    if (supabase && navigator.onLine) {
      runBackground(supabase.from('menu_items').upsert(items));
    }
  },

  // 2. ORDERS (Instant memory response)
  getOrders: async (filterDate?: string): Promise<Order[]> => {
    // If not in memory yet, load it once
    if (!memoryOrdersCache) {
      const local = await getLocalOrders();
      if (local && local.length > 0) {
        memoryOrdersCache = local;
      } else {
        const seed = generateRealisticOrders(30);
        memoryOrdersCache = seed;
        bulkSaveLocalOrders(seed).catch(() => {});
      }
    }

    const list = memoryOrdersCache || [];
    if (filterDate) {
      return list.filter((o) => o.order_date === filterDate);
    }
    return list;
  },

  // Atomic Place Order (0ms UI latency)
  placeOrder: async (
    orderMeta: {
      customer_name?: string;
      notes?: string;
      payment_type: 'cash' | 'upi' | 'card';
      is_paid: boolean;
      is_priority: boolean;
      assigned_chef?: string;
    },
    bowls: CartBowl[]
  ): Promise<Order> => {
    const todayStr = getKolkataDateString();
    const totalAmount = bowls.reduce((acc, b) => acc + b.bowl_unit_price * b.quantity, 0);

    const orderItemsPayload = bowls.flatMap((b) =>
      Array.from({ length: b.quantity }).map(() => ({
        size_id: b.size_id,
        flavor_id: b.flavor_id,
        size_name: b.size_name,
        size_code: b.size_code,
        flavor_name: b.flavor_name,
        free_topping: b.free_topping,
        price: b.bowl_unit_price,
        toppings: b.toppings.map((t) => ({
          topping_id: t.topping_id,
          topping_name: t.topping_name,
          price: t.price,
        })),
      }))
    );

    const currentOrders = memoryOrdersCache || [];
    const todayOrders = currentOrders.filter((o) => o.order_date === todayStr);
    const nextToken = todayOrders.length > 0 ? Math.max(...todayOrders.map((o) => o.token_number)) + 1 : 1;
    const orderId = 'ord-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const newOrder: Order = {
      id: orderId,
      token_number: nextToken,
      order_date: todayStr,
      status: 'new',
      is_priority: orderMeta.is_priority,
      customer_name: orderMeta.customer_name,
      notes: orderMeta.notes,
      payment_type: orderMeta.payment_type,
      is_paid: orderMeta.is_paid,
      total_amount: totalAmount,
      assigned_chef: orderMeta.assigned_chef || 'Chef 1',
      is_demo: false,
      created_at: new Date().toISOString(),
      items: orderItemsPayload.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        order_id: orderId,
        size_id: item.size_id,
        flavor_id: item.flavor_id,
        size_name: item.size_name,
        size_code: item.size_code,
        flavor_name: item.flavor_name,
        free_topping: item.free_topping,
        price: item.price,
        toppings: item.toppings.map((t, tidx) => ({
          id: `top-${Date.now()}-${idx}-${tidx}`,
          topping_id: t.topping_id,
          topping_name: t.topping_name,
          price: t.price,
        })),
      })),
    };

    // Update in-memory cache instantly
    memoryOrdersCache = [newOrder, ...currentOrders];

    // Asynchronous background persistence (does NOT block user interface)
    saveLocalOrder(newOrder).catch(() => {});

    if (supabase && navigator.onLine) {
      runBackground(
        supabase.rpc('place_order_atomic', {
          p_order: {
            ...orderMeta,
            total_amount: totalAmount,
            order_date: todayStr,
            status: 'new',
            created_at: newOrder.created_at,
          },
          p_items: orderItemsPayload,
        })
      );
    }

    notifyLocalRealtime('INSERT', newOrder);
    return newOrder;
  },

  // Update order status & timestamps (0ms UI latency)
  updateOrderStatus: async (
    orderId: string,
    status?: Order['status'],
    assignedChef?: string,
    cancellationReason?: string
  ): Promise<void> => {
    const nowIso = new Date().toISOString();
    const updates: Partial<Order> = {};
    if (status) updates.status = status;
    if (assignedChef !== undefined) updates.assigned_chef = assignedChef;
    if (cancellationReason) updates.cancellation_reason = cancellationReason;

    if (status === 'preparing') updates.preparing_at = nowIso;
    if (status === 'ready') updates.ready_at = nowIso;
    if (status === 'completed') updates.completed_at = nowIso;

    // Update in-memory cache instantly
    if (memoryOrdersCache) {
      memoryOrdersCache = memoryOrdersCache.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, ...updates };
          notifyLocalRealtime('UPDATE', updated, o);
          // Persist in background
          saveLocalOrder(updated).catch(() => {});
          return updated;
        }
        return o;
      });
    }

    if (supabase && navigator.onLine) {
      runBackground(supabase.from('orders').update(updates).eq('id', orderId));
    }
  },

  syncPendingOrders: async (): Promise<number> => {
    if (!supabase || !navigator.onLine) return 0;
    const pending = await getPendingOfflineOrders();
    let syncedCount = 0;

    for (const item of pending) {
      try {
        const { data, error } = await supabase.rpc('place_order_atomic', {
          p_order: item.order_payload,
          p_items: item.items_payload,
        });

        if (!error && data) {
          await removePendingOfflineOrder(item.temp_id);
          syncedCount++;
        }
      } catch (e) {
        // sync error
      }
    }

    return syncedCount;
  },

  getSettings: async (): Promise<AppSettings> => {
    const local = localStorage.getItem('fc_app_settings');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // fallback
      }
    }
    return DEFAULT_APP_SETTINGS;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    localStorage.setItem('fc_app_settings', JSON.stringify(settings));
    if (supabase && navigator.onLine) {
      for (const [key, value] of Object.entries(settings)) {
        runBackground(supabase.from('app_settings').upsert({ key, value }));
      }
    }
  },

  clearDemoData: async (): Promise<void> => {
    if (memoryOrdersCache) {
      memoryOrdersCache = memoryOrdersCache.filter((o) => !o.is_demo);
      bulkSaveLocalOrders(memoryOrdersCache).catch(() => {});
    }
    if (supabase && navigator.onLine) {
      runBackground(supabase.rpc('clean_demo_data'));
    }
  },

  generateFreshDemoData: async (days: number = 30): Promise<void> => {
    const seed = generateRealisticOrders(days);
    memoryOrdersCache = seed;
    bulkSaveLocalOrders(seed).catch(() => {});
  },
};

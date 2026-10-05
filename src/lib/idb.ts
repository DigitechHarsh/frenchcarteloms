import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { MenuItem, Order } from '../types';

interface FrenchCartelDB extends DBSchema {
  menu_cache: {
    key: string;
    value: MenuItem;
  };
  pending_sync_orders: {
    key: string;
    value: {
      temp_id: string;
      order_payload: Partial<Order>;
      items_payload: any[];
      created_at: string;
    };
  };
  local_orders: {
    key: string;
    value: Order;
    indexes: { 'by-date': string; 'by-status': string };
  };
  app_settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'french_cartel_oms_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FrenchCartelDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FrenchCartelDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('menu_cache')) {
          db.createObjectStore('menu_cache', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_sync_orders')) {
          db.createObjectStore('pending_sync_orders', { keyPath: 'temp_id' });
        }
        if (!db.objectStoreNames.contains('local_orders')) {
          const orderStore = db.createObjectStore('local_orders', { keyPath: 'id' });
          orderStore.createIndex('by-date', 'order_date');
          orderStore.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains('app_settings')) {
          db.createObjectStore('app_settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// Menu caching
export async function cacheMenuItemsLocally(items: MenuItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('menu_cache', 'readwrite');
  await tx.store.clear();
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function getCachedMenuItems(): Promise<MenuItem[]> {
  const db = await getDB();
  return db.getAll('menu_cache');
}

// Offline sync queue
export async function queueOfflineOrder(temp_id: string, order_payload: Partial<Order>, items_payload: any[]) {
  const db = await getDB();
  await db.put('pending_sync_orders', {
    temp_id,
    order_payload,
    items_payload,
    created_at: new Date().toISOString()
  });
}

export async function getPendingOfflineOrders() {
  const db = await getDB();
  return db.getAll('pending_sync_orders');
}

export async function removePendingOfflineOrder(temp_id: string) {
  const db = await getDB();
  await db.delete('pending_sync_orders', temp_id);
}

// Local orders storage (for offline or demo mode)
export async function saveLocalOrder(order: Order) {
  const db = await getDB();
  await db.put('local_orders', order);
}

export async function getLocalOrders(): Promise<Order[]> {
  const db = await getDB();
  return db.getAll('local_orders');
}

export async function bulkSaveLocalOrders(orders: Order[]) {
  const db = await getDB();
  const tx = db.transaction('local_orders', 'readwrite');
  for (const o of orders) {
    await tx.store.put(o);
  }
  await tx.done;
}

export async function clearLocalOrders() {
  const db = await getDB();
  await db.clear('local_orders');
}

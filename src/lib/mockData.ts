import type { MenuItem, Order, OrderItem, AppSettings } from '../types';
import { getKolkataDateString } from './formatters';

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Sizes
  { id: 'size-1', type: 'size', name: 'Bite', short_code: 'B', price: 169, is_active: true, sort_order: 1, color_hint: '#FAAD14' },
  { id: 'size-2', type: 'size', name: 'KiloBite', short_code: 'KB', price: 279, is_active: true, sort_order: 2, color_hint: '#F5222D' },
  { id: 'size-3', type: 'size', name: 'MegaBite', short_code: 'MB', price: 329, is_active: true, sort_order: 3, color_hint: '#D4380D' },
  { id: 'size-4', type: 'size', name: 'GigaBite', short_code: 'GB', price: 389, is_active: true, sort_order: 4, color_hint: '#722ED1' },

  // Flavors (Free, pick exactly one)
  { id: 'flavor-1', type: 'flavor', name: 'Spicy Chipotle', short_code: 'SC', price: 0, is_active: true, sort_order: 1, color_hint: '#E65100' },
  { id: 'flavor-2', type: 'flavor', name: 'Chilly Cheese', short_code: 'CC', price: 0, is_active: true, sort_order: 2, color_hint: '#FA8C16' },
  { id: 'flavor-3', type: 'flavor', name: 'Cheese Peri Peri', short_code: 'CPP', price: 0, is_active: true, sort_order: 3, color_hint: '#FAAD14' },
  { id: 'flavor-4', type: 'flavor', name: 'Korean BBQ', short_code: 'KBBQ', price: 0, is_active: true, sort_order: 4, color_hint: '#873800' },

  // Paid Toppings
  { id: 'topping-1', type: 'topping', name: 'Nachos', short_code: 'NCH', price: 60, is_active: true, sort_order: 1, color_hint: '#D48806' },
  { id: 'topping-2', type: 'topping', name: 'Extra Cheese', short_code: 'XC', price: 30, is_active: true, sort_order: 2, color_hint: '#FFC069' },
  { id: 'topping-3', type: 'topping', name: 'Kurkure', short_code: 'KK', price: 40, is_active: true, sort_order: 3, color_hint: '#CF1322' },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  truck_name: 'French Cartel',
  pin_cashier: '1111',
  pin_kitchen: '2222',
  pin_admin: '9999',
  timer_amber_minutes: 10,
  timer_red_minutes: 15,
  sound_alerts_enabled: true,
};

/**
 * Generate 30 days of realistic orders for local mock / demo mode
 */
export function generateRealisticOrders(daysBack: number = 30): Order[] {
  const orders: Order[] = [];
  const today = new Date();
  const customerNames = ['Rahul', 'Aman', 'Pooja', 'Sneha', 'Vikram', 'Rohan', 'Ananya', 'Kavya', 'Aditya', 'Neha', 'Karan', 'Priya', 'Siddharth'];
  const notesList = ['Extra crispy fries please', 'Less spicy', 'Keep seasoning light', 'Sauce on the side', 'Special crispiness'];

  const sizes = DEFAULT_MENU_ITEMS.filter((m) => m.type === 'size');
  const flavors = DEFAULT_MENU_ITEMS.filter((m) => m.type === 'flavor');
  const toppings = DEFAULT_MENU_ITEMS.filter((m) => m.type === 'topping');

  for (let d = daysBack; d >= 0; d--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - d);
    const dateStr = getKolkataDateString(targetDate);
    const dayOfWeek = targetDate.getDay();

    // Balanced realistic order distribution (120-150 total orders across 30 days)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const orderCount = d === 0 ? 8 : (isWeekend ? 5 : 4);

    for (let t = 1; t <= orderCount; t++) {
      // Pick realistic hour: 12-14 (lunch) or 17-22 (evening)
      let hour: number;
      const rndH = Math.random();
      if (rndH < 0.25) {
        hour = 12 + Math.floor(Math.random() * 3);
      } else if (rndH < 0.85) {
        hour = 18 + Math.floor(Math.random() * 4);
      } else {
        hour = 15 + Math.floor(Math.random() * 3);
      }
      const minute = Math.floor(Math.random() * 60);

      const orderTime = new Date(targetDate);
      orderTime.setHours(hour, minute, Math.floor(Math.random() * 60), 0);
      const isoCreated = orderTime.toISOString();

      // Status
      let status: Order['status'] = 'completed';
      if (d === 0) {
        // Today has active pipeline
        const rndS = Math.random();
        if (rndS < 0.15) status = 'new';
        else if (rndS < 0.35) status = 'preparing';
        else if (rndS < 0.50) status = 'ready';
        else if (rndS < 0.94) status = 'completed';
        else status = 'cancelled';
      } else {
        status = Math.random() < 0.96 ? 'completed' : 'cancelled';
      }

      const prepMins = 8 + Math.floor(Math.random() * 10);
      const prepTime = new Date(orderTime.getTime() + 2 * 60000).toISOString();
      const readyTime = new Date(orderTime.getTime() + prepMins * 60000).toISOString();
      const compTime = new Date(orderTime.getTime() + (prepMins + 4) * 60000).toISOString();

      const paymentType: Order['payment_type'] = Math.random() < 0.65 ? 'upi' : Math.random() < 0.85 ? 'card' : 'cash';
      const chef = Math.random() < 0.5 ? 'Chef 1' : 'Chef 2';

      // 1 to 3 bowls
      const bowlCount = Math.random() < 0.65 ? 1 : Math.random() < 0.9 ? 2 : 3;
      const items: OrderItem[] = [];
      let totalAmount = 0;

      for (let b = 0; b < bowlCount; b++) {
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const flavor = flavors[Math.floor(Math.random() * flavors.length)];

        let bowlPrice = size.price;
        const bowlToppings: { id: string; topping_id: string; topping_name: string; price: number }[] = [];

        // 40% chance of paid topping
        if (Math.random() < 0.45) {
          const top = toppings[Math.floor(Math.random() * toppings.length)];
          bowlPrice += top.price;
          bowlToppings.push({
            id: `top-${d}-${t}-${b}`,
            topping_id: top.id,
            topping_name: top.name,
            price: top.price
          });
        }

        totalAmount += bowlPrice;
        items.push({
          id: `item-${d}-${t}-${b}`,
          order_id: `ord-${d}-${t}`,
          size_id: size.id,
          size_name: size.name,
          size_code: size.short_code,
          flavor_id: flavor.id,
          flavor_name: flavor.name,
          free_topping: 'None',
          price: bowlPrice,
          toppings: bowlToppings
        });
      }

      orders.push({
        id: `ord-${d}-${t}`,
        token_number: t,
        order_date: dateStr,
        status,
        is_priority: false,
        customer_name: Math.random() < 0.7 ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
        notes: Math.random() < 0.2 ? notesList[Math.floor(Math.random() * notesList.length)] : undefined,
        payment_type: paymentType,
        is_paid: status !== 'cancelled' && Math.random() > 0.05,
        total_amount: totalAmount,
        assigned_chef: chef,
        is_demo: true,
        created_at: isoCreated,
        preparing_at: status !== 'new' ? prepTime : undefined,
        ready_at: status === 'ready' || status === 'completed' ? readyTime : undefined,
        completed_at: status === 'completed' ? compTime : undefined,
        items
      });
    }
  }

  return orders;
}

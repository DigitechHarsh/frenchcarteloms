export type MenuItemType = 'size' | 'flavor' | 'topping' | 'free_topping';

export type FreeToppingChoice = 'Jalapeno' | 'Olives' | 'None';

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'upi' | 'card';

export type UserRole = 'cashier' | 'kitchen' | 'admin';

export interface MenuItem {
  id: string;
  type: MenuItemType;
  name: string;
  short_code: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  color_hint?: string;
  created_at?: string;
}

export interface BowlTopping {
  id?: string;
  topping_id: string;
  topping_name: string;
  price: number;
}

export interface CartBowl {
  id: string; // client temporary uid
  size_id: string;
  size_name: string;
  size_code: string;
  flavor_id: string;
  flavor_name: string;
  free_topping: FreeToppingChoice;
  toppings: BowlTopping[];
  bowl_unit_price: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  size_id?: string;
  flavor_id?: string;
  size_name: string;
  size_code: string;
  flavor_name: string;
  free_topping: FreeToppingChoice;
  price: number;
  toppings?: {
    id: string;
    topping_id?: string;
    topping_name: string;
    price: number;
  }[];
}

export interface Order {
  id: string;
  token_number: number;
  order_date: string; // YYYY-MM-DD
  status: OrderStatus;
  is_priority: boolean;
  customer_name?: string;
  notes?: string;
  payment_type: PaymentMethod;
  is_paid: boolean;
  total_amount: number;
  assigned_chef?: string;
  is_demo?: boolean;
  cancellation_reason?: string;
  audit_notes?: string;
  created_at: string;
  preparing_at?: string;
  ready_at?: string;
  completed_at?: string;
  items?: OrderItem[];
  // Offline sync metadata
  is_local_pending?: boolean;
  local_temp_id?: string;
}

export interface AppSettings {
  truck_name: string;
  pin_cashier: string;
  pin_kitchen: string;
  pin_admin: string;
  timer_amber_minutes: number;
  timer_red_minutes: number;
  sound_alerts_enabled: boolean;
}

export interface DashboardSummary {
  total_revenue: number;
  total_orders: number;
  total_bowls: number;
  avg_order_value: number;
  cancelled_orders: number;
  avg_prep_time_minutes: number;
  prev_revenue: number;
  prev_orders: number;
}

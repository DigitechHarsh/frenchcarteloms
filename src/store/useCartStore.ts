import { create } from 'zustand';
import type { CartBowl, FreeToppingChoice, MenuItem, BowlTopping, PaymentMethod } from '../types';

interface CartState {
  // Current bowl being composed on the left
  selectedSize: MenuItem | null;
  selectedFlavor: MenuItem | null;
  selectedToppings: MenuItem[];
  selectedFreeTopping: FreeToppingChoice;
  editingBowlId: string | null;

  // Cart items on the right
  bowls: CartBowl[];
  lastAddedBowl: CartBowl | null;

  // Order metadata
  customerName: string;
  notes: string;
  isPriority: boolean;
  paymentType: PaymentMethod;
  isPaid: boolean;

  // Actions for Bowl Composer
  setSelectedSize: (size: MenuItem) => void;
  setSelectedFlavor: (flavor: MenuItem) => void;
  togglePaidTopping: (topping: MenuItem) => void;
  setSelectedFreeTopping: (choice: FreeToppingChoice) => void;
  resetComposer: () => void;

  // Actions for Cart
  addOrUpdateBowlInCart: () => boolean;
  repeatLastBowl: () => void;
  updateQuantity: (id: string, delta: number) => void;
  removeBowl: (id: string) => void;
  editBowl: (bowl: CartBowl, menuItems: MenuItem[]) => void;
  clearCart: () => void;

  // Metadata setters
  setCustomerName: (name: string) => void;
  setNotes: (notes: string) => void;
  setIsPriority: (priority: boolean) => void;
  setPaymentType: (type: PaymentMethod) => void;
  setIsPaid: (paid: boolean) => void;

  // Calculated values
  getCurrentBowlUnitPrice: () => number;
  getTotalCartAmount: () => number;
  getTotalBowlsCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  selectedSize: null,
  selectedFlavor: null,
  selectedToppings: [],
  selectedFreeTopping: 'None',
  editingBowlId: null,

  bowls: [],
  lastAddedBowl: null,

  customerName: '',
  notes: '',
  isPriority: false,
  paymentType: 'upi',
  isPaid: true,

  setSelectedSize: (size) => set({ selectedSize: size }),
  setSelectedFlavor: (flavor) => set({ selectedFlavor: flavor }),

  togglePaidTopping: (topping) => {
    const { selectedToppings } = get();
    const exists = selectedToppings.some((t) => t.id === topping.id);
    if (exists) {
      set({ selectedToppings: selectedToppings.filter((t) => t.id !== topping.id) });
    } else {
      set({ selectedToppings: [...selectedToppings, topping] });
    }
  },

  // Free topping: Jalapeno / Olives / None - ONLY ONE CAN BE CHOSEN
  setSelectedFreeTopping: (choice) => set({ selectedFreeTopping: choice }),

  resetComposer: () => {
    set({
      selectedSize: null,
      selectedFlavor: null,
      selectedToppings: [],
      selectedFreeTopping: 'None',
      editingBowlId: null,
    });
  },

  getCurrentBowlUnitPrice: () => {
    const { selectedSize, selectedToppings } = get();
    if (!selectedSize) return 0;
    const toppingsTotal = selectedToppings.reduce((acc, t) => acc + (t.price || 0), 0);
    return selectedSize.price + toppingsTotal;
  },

  addOrUpdateBowlInCart: () => {
    const {
      selectedSize,
      selectedFlavor,
      selectedToppings,
      selectedFreeTopping,
      editingBowlId,
      bowls,
      getCurrentBowlUnitPrice,
    } = get();

    if (!selectedSize || !selectedFlavor) {
      return false;
    }

    const unitPrice = getCurrentBowlUnitPrice();
    const toppingsList: BowlTopping[] = selectedToppings.map((t) => ({
      topping_id: t.id,
      topping_name: t.name,
      price: t.price,
    }));

    if (editingBowlId) {
      // Update existing bowl in cart
      const updatedBowls = bowls.map((b) => {
        if (b.id === editingBowlId) {
          return {
            ...b,
            size_id: selectedSize.id,
            size_name: selectedSize.name,
            size_code: selectedSize.short_code,
            flavor_id: selectedFlavor.id,
            flavor_name: selectedFlavor.name,
            free_topping: selectedFreeTopping,
            toppings: toppingsList,
            bowl_unit_price: unitPrice,
          };
        }
        return b;
      });
      set({ bowls: updatedBowls, editingBowlId: null });
    } else {
      // Add new bowl
      const newBowl: CartBowl = {
        id: 'bowl-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        size_id: selectedSize.id,
        size_name: selectedSize.name,
        size_code: selectedSize.short_code,
        flavor_id: selectedFlavor.id,
        flavor_name: selectedFlavor.name,
        free_topping: selectedFreeTopping,
        toppings: toppingsList,
        bowl_unit_price: unitPrice,
        quantity: 1,
      };

      set({
        bowls: [...bowls, newBowl],
        lastAddedBowl: newBowl,
      });
    }

    // Reset composer for next item
    get().resetComposer();
    return true;
  },

  repeatLastBowl: () => {
    const { lastAddedBowl, bowls } = get();
    if (!lastAddedBowl) return;

    const clonedBowl: CartBowl = {
      ...lastAddedBowl,
      id: 'bowl-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      quantity: 1,
    };

    set({
      bowls: [...bowls, clonedBowl],
      lastAddedBowl: clonedBowl,
    });
  },

  updateQuantity: (id, delta) => {
    const { bowls } = get();
    const updated = bowls
      .map((b) => {
        if (b.id === id) {
          const newQty = b.quantity + delta;
          return newQty > 0 ? { ...b, quantity: newQty } : null;
        }
        return b;
      })
      .filter(Boolean) as CartBowl[];

    set({ bowls: updated });
  },

  removeBowl: (id) => {
    const { bowls } = get();
    set({ bowls: bowls.filter((b) => b.id !== id) });
  },

  editBowl: (bowl, menuItems) => {
    const size = menuItems.find((m) => m.id === bowl.size_id && m.type === 'size') || null;
    const flavor = menuItems.find((m) => m.id === bowl.flavor_id && m.type === 'flavor') || null;
    const toppings = menuItems.filter(
      (m) => m.type === 'topping' && bowl.toppings.some((t) => t.topping_id === m.id)
    );

    set({
      selectedSize: size,
      selectedFlavor: flavor,
      selectedToppings: toppings,
      selectedFreeTopping: bowl.free_topping,
      editingBowlId: bowl.id,
    });
  },

  clearCart: () => {
    set({
      bowls: [],
      customerName: '',
      notes: '',
      isPriority: false,
      isPaid: true,
      paymentType: 'upi',
      editingBowlId: null,
      selectedSize: null,
      selectedFlavor: null,
      selectedToppings: [],
      selectedFreeTopping: 'None',
    });
  },

  setCustomerName: (name) => set({ customerName: name }),
  setNotes: (notes) => set({ notes: notes }),
  setIsPriority: (priority) => set({ isPriority: priority }),
  setPaymentType: (type) => set({ paymentType: type }),
  setIsPaid: (paid) => set({ isPaid: paid }),

  getTotalCartAmount: () => {
    const { bowls } = get();
    return bowls.reduce((acc, b) => acc + b.bowl_unit_price * b.quantity, 0);
  },

  getTotalBowlsCount: () => {
    const { bowls } = get();
    return bowls.reduce((acc, b) => acc + b.quantity, 0);
  },
}));

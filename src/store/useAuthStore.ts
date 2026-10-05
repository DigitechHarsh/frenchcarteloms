import { create } from 'zustand';
import type { UserRole } from '../types';

interface AuthState {
  currentRole: UserRole;
  isPinModalOpen: boolean;
  targetRole: UserRole | null;
  pins: {
    cashier: string;
    kitchen: string;
    admin: string;
  };
  setRole: (role: UserRole) => void;
  openPinModal: (role: UserRole) => void;
  closePinModal: () => void;
  verifyPin: (pin: string) => boolean;
  updatePins: (pins: { cashier?: string; kitchen?: string; admin?: string }) => void;
}

const DEFAULT_PINS = {
  cashier: '1111',
  kitchen: '2222',
  admin: '9999',
};

export const useAuthStore = create<AuthState>((set, get) => {
  const savedRole = (localStorage.getItem('fc_role') as UserRole) || 'cashier';
  const savedPins = localStorage.getItem('fc_pins');
  const initialPins = savedPins ? JSON.parse(savedPins) : DEFAULT_PINS;

  return {
    currentRole: savedRole,
    isPinModalOpen: false,
    targetRole: null,
    pins: initialPins,

    setRole: (role: UserRole) => {
      localStorage.setItem('fc_role', role);
      set({ currentRole: role, isPinModalOpen: false, targetRole: null });
    },

    openPinModal: (role: UserRole) => {
      // If switching to currently active role, do nothing
      if (get().currentRole === role) return;
      set({ isPinModalOpen: true, targetRole: role });
    },

    closePinModal: () => {
      set({ isPinModalOpen: false, targetRole: null });
    },

    verifyPin: (pin: string) => {
      const { targetRole, pins } = get();
      if (!targetRole) return false;

      // Admin PIN unlocks everything
      if (pin === pins.admin) {
        get().setRole(targetRole);
        return true;
      }

      if (targetRole === 'cashier' && pin === pins.cashier) {
        get().setRole('cashier');
        return true;
      }

      if (targetRole === 'kitchen' && pin === pins.kitchen) {
        get().setRole('kitchen');
        return true;
      }

      return false;
    },

    updatePins: (newPins) => {
      const updated = { ...get().pins, ...newPins };
      localStorage.setItem('fc_pins', JSON.stringify(updated));
      set({ pins: updated });
    },
  };
});

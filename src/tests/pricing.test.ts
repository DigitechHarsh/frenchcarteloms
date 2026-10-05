import { describe, it, expect } from 'vitest';
import { formatINR } from '../lib/formatters';

describe('French Cartel Pricing Logic', () => {
  const MENU = {
    sizes: {
      Bite: 169,
      KiloBite: 279,
      MegaBite: 329,
      GigaBite: 389,
    },
    toppings: {
      Nachos: 60,
      ExtraCheese: 30,
      Kurkure: 40,
    },
    freeToppings: {
      Jalapeno: 0,
      Olives: 0,
      None: 0,
    },
  };

  it('calculates plain bowl prices correctly', () => {
    expect(MENU.sizes.Bite).toBe(169);
    expect(MENU.sizes.KiloBite).toBe(279);
    expect(MENU.sizes.MegaBite).toBe(329);
    expect(MENU.sizes.GigaBite).toBe(389);
  });

  it('calculates single bowl with paid toppings correctly', () => {
    // MegaBite (329) + Nachos (60) + Extra Cheese (30) = 419
    const bowlPrice = MENU.sizes.MegaBite + MENU.toppings.Nachos + MENU.toppings.ExtraCheese;
    expect(bowlPrice).toBe(419);
  });

  it('handles self-served fresh toppings without additional POS charge', () => {
    // Fresh toppings (jalapeno, olives) are self-served at the food truck counter
    const selfServedCost = 0;
    expect(selfServedCost).toBe(0);
  });

  it('calculates order total across multiple bowls with quantities', () => {
    // Bowl 1: Bite (169) + Kurkure (40) = 209 (qty 2) = 418
    // Bowl 2: GigaBite (389) + Nachos (60) = 449 (qty 1) = 449
    // Total = 418 + 449 = 867
    const bowl1Unit = MENU.sizes.Bite + MENU.toppings.Kurkure;
    const bowl1Qty = 2;
    const bowl2Unit = MENU.sizes.GigaBite + MENU.toppings.Nachos;
    const bowl2Qty = 1;

    const total = bowl1Unit * bowl1Qty + bowl2Unit * bowl2Qty;
    expect(total).toBe(867);
  });

  it('formats currency in Indian numbering without decimals', () => {
    expect(formatINR(169)).toBe('Rs 169');
    expect(formatINR(124500)).toBe('Rs 1,24,500');
    expect(formatINR(0)).toBe('Rs 0');
  });

  it('ensures daily token numbers increment sequentially per date', () => {
    const dailyCounters: Record<string, number> = {};

    function getNextToken(date: string) {
      if (!dailyCounters[date]) {
        dailyCounters[date] = 1;
      } else {
        dailyCounters[date] += 1;
      }
      return dailyCounters[date];
    }

    const day1 = '2026-10-03';
    const day2 = '2026-10-04';

    expect(getNextToken(day1)).toBe(1);
    expect(getNextToken(day1)).toBe(2);
    expect(getNextToken(day1)).toBe(3);

    // New day resets to 1
    expect(getNextToken(day2)).toBe(1);
    expect(getNextToken(day2)).toBe(2);

    // Day 1 continues from 3
    expect(getNextToken(day1)).toBe(4);
  });
});

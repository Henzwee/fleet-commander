/**
 * MarketEngine - Single source of truth for market pricing
 * Manages dynamic pricing, price history, and notifies subscribers
 */

const STORAGE_KEY = 'market_state_v1';

class MarketEngineClass {
  constructor() {
    this.items = new Map();
    this.subscribers = [];
  }

  /**
   * Initialize market with base items
   */
  init(baseItems) {
    // Try to load from localStorage
    const stored = this.loadFromStorage();
    
    baseItems.forEach(item => {
      if (stored && stored[item.id]) {
        // Use stored prices
        this.items.set(item.id, {
          ...item,
          ...stored[item.id]
        });
      } else {
        // Initialize new item
        this.items.set(item.id, {
          id: item.id,
          name: item.name,
          basePrice: item.basePrice,
          currentPrice: item.basePrice,
          previousPrice: item.basePrice,
          deltaPercent: 0
        });
      }
    });
    
    this.saveToStorage();
  }

  /**
   * Reprice a specific item (called on ticker rotation)
   */
  reprice(itemId) {
    const item = this.items.get(itemId);
    if (!item) return;

    // Generate new price: ±25% of base price
    const fluctuation = (Math.random() - 0.5) * 0.5; // -25% to +25%
    const newPrice = Math.round(item.basePrice * (1 + fluctuation));

    // Calculate delta vs previous price
    const deltaPercent = item.currentPrice 
      ? Math.round(((newPrice - item.currentPrice) / item.currentPrice) * 100)
      : 0;

    // Update item
    item.previousPrice = item.currentPrice;
    item.currentPrice = newPrice;
    item.deltaPercent = deltaPercent;

    this.items.set(itemId, item);
    this.saveToStorage();
    this.notifySubscribers();
  }

  /**
   * Get current price data for an item
   */
  get(itemId) {
    return this.items.get(itemId);
  }

  /**
   * Get all items
   */
  getAll() {
    return Array.from(this.items.values());
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of price changes
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.getAll()));
  }

  /**
   * Save current state to localStorage
   */
  saveToStorage() {
    const state = {};
    this.items.forEach((item, id) => {
      state[id] = {
        currentPrice: item.currentPrice,
        previousPrice: item.previousPrice,
        deltaPercent: item.deltaPercent
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /**
   * Load state from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load market state:', error);
      return null;
    }
  }
}

// Export singleton instance
export const MarketEngine = new MarketEngineClass();
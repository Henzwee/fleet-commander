// Single source of truth for ship tier configuration
export const SHIP_TIERS = {
  'Unregistered': {
    maxLY: 100,
    payRange: [200, 500],
    priceRange: [1000, 2000]
  },
  'Known': {
    maxLY: 500,
    payRange: [250, 750],
    priceRange: [3000, 5000]
  },
  'Notorious': {
    maxLY: 1000,
    payRange: [300, 900],
    priceRange: [6000, 10000]
  },
  'Esteemed': {
    maxLY: 5000,
    payRange: [500, 1100],
    priceRange: [12000, 18000]
  },
  'Renowned': {
    maxLY: 10000,
    payRange: [750, 1800],
    priceRange: [20000, 30000]
  },
  'Legendary': {
    maxLY: 100000,
    payRange: [1000, 2000],
    priceRange: [40000, 60000]
  }
};

export const TIER_ORDER = ['Unregistered', 'Known', 'Notorious', 'Esteemed', 'Renowned', 'Legendary'];

export function getTierConfig(tier) {
  return SHIP_TIERS[tier];
}

export function getMaxLYForTier(tier) {
  return SHIP_TIERS[tier]?.maxLY || 0;
}

export function getTierForDistance(distance) {
  for (const tier of TIER_ORDER) {
    if (distance <= SHIP_TIERS[tier].maxLY) {
      return tier;
    }
  }
  return 'Legendary';
}
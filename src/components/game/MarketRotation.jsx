// Seeded random number generator
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

/**
 * Generates a weighted random market rotation
 * Items in recent rotations have reduced weight
 * Items not seen recently have increased weight
 */
export function generateWeightedRotation(allItemIds, rotationHistory = [], numItems = 6, seed = Date.now()) {
  const rng = new SeededRandom(seed);
  
  // Build weight map for each item
  const weights = {};
  
  allItemIds.forEach(itemId => {
    let weight = 1.0;
    
    // Check each history rotation (most recent to oldest)
    rotationHistory.forEach((historyRotation, index) => {
      if (historyRotation.includes(itemId)) {
        // Most recent rotation (index 0): multiply by 0.3
        // Second most recent (index 1): multiply by 0.6
        // Third most recent (index 2): multiply by 0.8
        const multiplier = index === 0 ? 0.3 : index === 1 ? 0.6 : 0.8;
        weight *= multiplier;
      }
    });
    
    // Boost items not seen in recent history
    const inAnyRecent = rotationHistory.some(rotation => rotation.includes(itemId));
    if (!inAnyRecent && rotationHistory.length > 0) {
      weight *= 1.6;
    }
    
    weights[itemId] = weight;
  });
  
  // Weighted random selection without replacement
  const selected = [];
  const remaining = [...allItemIds];
  
  for (let i = 0; i < numItems && remaining.length > 0; i++) {
    // Calculate total weight of remaining items
    const totalWeight = remaining.reduce((sum, id) => sum + weights[id], 0);
    
    // Pick a random point in the weight range
    let random = rng.next() * totalWeight;
    
    // Find which item that point lands on
    let selectedItem = null;
    for (const itemId of remaining) {
      random -= weights[itemId];
      if (random <= 0) {
        selectedItem = itemId;
        break;
      }
    }
    
    // Fallback to last item if rounding causes issues
    if (!selectedItem) {
      selectedItem = remaining[remaining.length - 1];
    }
    
    selected.push(selectedItem);
    remaining.splice(remaining.indexOf(selectedItem), 1);
  }
  
  return selected;
}

/**
 * Updates rotation history, keeping last 3 rotations
 */
export function updateRotationHistory(currentRotation, existingHistory = []) {
  const newHistory = [currentRotation, ...existingHistory];
  return newHistory.slice(0, 3); // Keep last 3
}
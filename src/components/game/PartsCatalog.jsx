// Ship part catalog
export const PARTS_CATALOG = {
  hull: ['Hull Plating', 'Sealant', 'Rivets'],
  power: ['Power Cell', 'Wiring Bundle', 'Fuse'],
  navigation: ['Antenna', 'Gyro', 'Circuit Board'],
  propulsion: ['Thruster Nozzle', 'Fuel Line', 'Coolant Pump']
};

export const ALL_PARTS = Object.values(PARTS_CATALOG).flat();

export function getRequiredPartCountFromDamage(damagePercent) {
  if (damagePercent >= 75) return 3;
  if (damagePercent >= 50) return 2;
  if (damagePercent >= 25) return 1;
  return 0;
}

export function generateRequiredParts(count) {
  if (count === 0) return [];
  
  const available = [...ALL_PARTS];
  const required = [];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    const partName = available.splice(randomIndex, 1)[0];
    required.push({ name: partName, qty: 1 });
  }
  
  return required;
}

export function hasParts(requiredParts, inventory) {
  for (const required of requiredParts) {
    const available = inventory[required.name] || 0;
    if (available < required.qty) {
      return false;
    }
  }
  return true;
}

export function consumeParts(requiredParts, inventory) {
  const newInventory = { ...inventory };
  
  for (const required of requiredParts) {
    newInventory[required.name] = (newInventory[required.name] || 0) - required.qty;
    if (newInventory[required.name] <= 0) {
      delete newInventory[required.name];
    }
  }
  
  return newInventory;
}
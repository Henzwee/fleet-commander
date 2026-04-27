// Ship part catalog
export const PART_IMAGES = {
  'Expired food rations': 'https://media.base44.com/images/public/695af5ca435140b76c0dadc9/236cb9259_Expiredfoodrations.png',
  'Mostly stable antimatter': 'https://media.base44.com/images/public/695af5ca435140b76c0dadc9/6fa536896_Mostlystableantimatter.png',
  'Wire splice': 'https://media.base44.com/images/public/695af5ca435140b76c0dadc9/34ff766a3_gumignorethis.png',
};

export const ALL_PARTS = [
  'Box of tangled wire',
  'Reformed evil AI',
  'Cracked glass',
  'Wire splice',
  'Rusty screws',
  'Stripped bolts',
  'Outdated map',
  'Mostly stable antimatter',
  'Expired food rations',
  'Sci-fi looking panel'
];

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
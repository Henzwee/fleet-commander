// Ship image mappings by tier
export const SHIP_IMAGES = {
  'Unregistered': [
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/1d6c8e2f1_unregistered1.png',
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/aaa217e4e_unregistered2.png',
    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695af5ca435140b76c0dadc9/898048e5d_unregistered3.png'
  ],
  'Known': [],
  'Notorious': [],
  'Esteemed': [],
  'Renowned': [],
  'Legendary': []
};

export function getRandomShipImage(tier) {
  const images = SHIP_IMAGES[tier] || [];
  if (images.length === 0) return null;
  return images[Math.floor(Math.random() * images.length)];
}
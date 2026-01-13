export const generateProductId = () => `PRD_${Date.now()}`;

export const generateBarcode = () => {
  // simple display unique barcode
  // example: BC-1736736323123-4821
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BC-${Date.now()}-${rand}`;
};

export const generateSku = (categoryCode: string, name: string) => {
  const cleanedName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);

  const rand = Math.floor(100 + Math.random() * 900);
  return `${categoryCode}-${cleanedName}-${rand}`;
};

/**
 * Service to handle product code generation
 */

/**
 * Generate a unique product code based on category
 * Format: CategoryCode/A00001 for parent
 * Child format: ParentCode/01, ParentCode/02 etc.
 */
async function generateProductCode(Product, category) {
  // Find latest product in this category that's not a child
  const latestProduct = await Product.findOne({ 
    category,
    type: { $ne: 'child' }
  }).sort({ createdAt: -1 });

  const baseCode = category.code; // e.g., "SHI/WTS"
  let nextNumber;

  if (latestProduct) {
    // Extract number from existing code (A00001 -> 1)
    const currentNumber = parseInt(latestProduct.code.split('/').pop().replace('A', ''));
    nextNumber = currentNumber + 1;
  } else {
    nextNumber = 1;
  }

  // Format: SHI/WTS/A00001
  return `${baseCode}/A${nextNumber.toString().padStart(5, '0')}`;
}

/**
 * Generate a child product code
 * @param {string} parentCode - The parent product's code
 * @param {number} childIndex - The index of the child (1-based)
 * @returns {string} The child product code
 */
function generateChildCode(parentCode, childIndex) {
  // Format: ParentCode/01, ParentCode/02 etc.
  return `${parentCode}/${childIndex.toString().padStart(2, '0')}`;
}

module.exports = {
  generateProductCode,
  generateChildCode
};
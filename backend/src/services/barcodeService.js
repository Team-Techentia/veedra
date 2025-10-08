const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

/**
 * Barcode Generation Service
 * Generates traditional barcode images as shown in screenshots
 */
class BarcodeService {
  
  /**
   * Generate barcode image as base64 string
   * @param {string} barcodeValue - The barcode number to encode
   * @param {object} options - Barcode generation options
   * @returns {string} Base64 encoded barcode image
   */
  static generateBarcodeImage(barcodeValue, options = {}) {
    const defaultOptions = {
      format: 'CODE128', // Traditional barcode format
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 12,
      textMargin: 2,
      fontOptions: 'bold',
      font: 'monospace',
      textAlign: 'center',
      textPosition: 'bottom',
      background: '#ffffff',
      lineColor: '#000000',
      margin: 10
    };

    const config = { ...defaultOptions, ...options };

    try {
      // Create canvas for barcode generation
      const canvas = createCanvas(300, 150);
      
      // Generate barcode
      JsBarcode(canvas, barcodeValue, config);
      
      // Return base64 encoded image
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Barcode generation error:', error);
      return null;
    }
  }

  /**
   * Generate barcode for product with enhanced formatting
   * @param {object} product - Product object
   * @returns {object} Barcode data with image and metadata
   */
  static generateProductBarcode(product) {
    if (!product.barcode) {
      throw new Error('Product must have a barcode value');
    }

    const barcodeImage = this.generateBarcodeImage(product.barcode, {
      width: 3,
      height: 80,
      fontSize: 10,
      textMargin: 5,
      margin: 15
    });

    return {
      barcode: product.barcode,
      productCode: product.code,
      productName: product.name,
      image: barcodeImage,
      format: 'CODE128',
      generatedAt: new Date(),
      metadata: {
        type: product.type,
        bundleType: product.bundle?.bundleType,
        category: product.category,
        vendor: product.vendor
      }
    };
  }

  /**
   * Generate multiple barcodes for bundle products
   * @param {object} parentProduct - Parent product
   * @param {array} childProducts - Child products array
   * @returns {array} Array of barcode data
   */
  static generateBundleBarcodes(parentProduct, childProducts = []) {
    const barcodes = [];

    // Generate parent barcode
    if (parentProduct.barcode) {
      barcodes.push({
        ...this.generateProductBarcode(parentProduct),
        role: 'parent',
        bundleInfo: {
          bundleType: parentProduct.bundle.bundleType,
          bundleSize: parentProduct.bundle.bundleSize,
          childrenCount: childProducts.length
        }
      });
    }

    // Generate child barcodes
    childProducts.forEach((child, index) => {
      if (child.barcode) {
        barcodes.push({
          ...this.generateProductBarcode(child),
          role: 'child',
          serialNumber: index + 1,
          parentBarcode: parentProduct.barcode,
          variant: child.childConfig?.variant || {}
        });
      }
    });

    return barcodes;
  }

  /**
   * Generate barcode for printing labels
   * @param {string} barcodeValue - Barcode value
   * @param {object} labelOptions - Label formatting options
   * @returns {string} Base64 image for label printing
   */
  static generatePrintableLabel(barcodeValue, labelOptions = {}) {
    const labelConfig = {
      format: 'CODE128',
      width: 4,
      height: 60,
      displayValue: true,
      fontSize: 14,
      fontOptions: 'bold',
      textMargin: 8,
      margin: 20,
      background: '#ffffff',
      lineColor: '#000000',
      ...labelOptions
    };

    return this.generateBarcodeImage(barcodeValue, labelConfig);
  }

  /**
   * Validate barcode format
   * @param {string} barcode - Barcode to validate
   * @returns {boolean} Whether barcode is valid
   */
  static validateBarcode(barcode) {
    // Basic validation for different barcode formats
    const patterns = {
      EAN13: /^\d{13}$/,
      CODE128: /^[\x00-\x7F]+$/,
      UPC: /^\d{12}$/
    };

    return Object.values(patterns).some(pattern => pattern.test(barcode));
  }
}

module.exports = BarcodeService;
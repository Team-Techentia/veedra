import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * BarcodeDisplay Component
 * Generates and displays traditional barcodes as shown in screenshots
 */
const BarcodeDisplay = ({ 
  value, 
  width = 2, 
  height = 100, 
  displayValue = true, 
  fontSize = 12,
  className = '',
  format = 'CODE128'
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (value && canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          textMargin: 2,
          fontOptions: 'bold',
          font: 'monospace',
          textAlign: 'center',
          textPosition: 'bottom',
          background: '#ffffff',
          lineColor: '#000000',
          margin: 10
        });
      } catch (error) {
        console.error('Barcode generation error:', error);
      }
    }
  }, [value, width, height, displayValue, fontSize, format]);

  if (!value) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded ${className}`} style={{ height: height + 40 }}>
        <span className="text-gray-500 text-sm">No barcode data</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <canvas 
        ref={canvasRef}
        className="max-w-full h-auto border border-gray-200 rounded bg-white"
      />
    </div>
  );
};

/**
 * ProductBarcodeCard Component
 * Displays product information with barcode (matching screenshot layout)
 */
const ProductBarcodeCard = ({ product, showDetails = true }) => {
  if (!product) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {showDetails && (
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          <p className="text-sm text-gray-600">Code: {product.code}</p>
          {product.type === 'child' && product.childConfig?.variant && (
            <p className="text-xs text-blue-600">
              {product.childConfig.variant.size} - {product.childConfig.variant.color}
            </p>
          )}
        </div>
      )}
      
      <BarcodeDisplay 
        value={product.barcode} 
        width={2}
        height={60}
        displayValue={true}
        fontSize={10}
        className="mb-2"
      />
      
      {showDetails && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">Barcode: {product.barcode}</p>
          <p className="text-sm font-medium text-green-600">₹{product.pricing?.sellingPrice || 0}</p>
        </div>
      )}
    </div>
  );
};

/**
 * BundleBarcodeGrid Component
 * Displays all barcodes for a bundle (parent + children)
 */
const BundleBarcodeGrid = ({ parentProduct, childProducts = [] }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Bundle Barcodes</h3>
        
        {/* Parent Product Barcode */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-blue-600 mb-2">Parent Product</h4>
          <ProductBarcodeCard product={parentProduct} />
        </div>
        
        {/* Child Products Barcodes */}
        {childProducts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-2">
              Child Products ({childProducts.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {childProducts.map((child, index) => (
                <ProductBarcodeCard 
                  key={child._id || index} 
                  product={child} 
                  showDetails={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * PrintableBarcodeLabel Component
 * Generates printable barcode labels (for label printing)
 */
const PrintableBarcodeLabel = ({ product, labelSize = 'small' }) => {
  const sizes = {
    small: { width: 3, height: 50, fontSize: 8 },
    medium: { width: 4, height: 70, fontSize: 10 },
    large: { width: 5, height: 90, fontSize: 12 }
  };
  
  const size = sizes[labelSize] || sizes.medium;

  return (
    <div className="bg-white border border-gray-400 p-2 inline-block" style={{ width: 'fit-content' }}>
      <div className="text-center mb-1">
        <p className="text-xs font-medium truncate" style={{ maxWidth: '200px' }}>
          {product.name}
        </p>
        <p className="text-xs text-gray-600">{product.code}</p>
      </div>
      
      <BarcodeDisplay 
        value={product.barcode}
        width={size.width}
        height={size.height}
        displayValue={true}
        fontSize={size.fontSize}
      />
      
      <div className="text-center mt-1">
        <p className="text-xs font-bold">₹{product.pricing?.sellingPrice || 0}</p>
        {product.pricing?.mrp && product.pricing.mrp > product.pricing.sellingPrice && (
          <p className="text-xs text-gray-500 line-through">₹{product.pricing.mrp}</p>
        )}
      </div>
    </div>
  );
};

export { 
  BarcodeDisplay, 
  ProductBarcodeCard, 
  BundleBarcodeGrid, 
  PrintableBarcodeLabel 
};
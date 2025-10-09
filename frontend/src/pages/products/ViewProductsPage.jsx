import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, ChevronRight, ChevronDown, Printer, Package, Search, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';

const ViewProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [parentProducts, setParentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBundles, setExpandedBundles] = useState(new Set());
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(30);
  const printRef = useRef();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      const allProducts = response.data || response || [];
      
      // Separate parent and child products
      const parents = allProducts.filter(p => p.type === 'parent' || p.type === 'standalone');
      const children = allProducts.filter(p => p.type === 'child');
      
      // Find orphaned children
      const parentIds = new Set(parents.map(p => p._id));
      const orphanedChildren = children.filter(child => !child.parentProduct || !parentIds.has(child.parentProduct));
      
      // Group children by parent
      const childrenByParent = {};
      children.forEach(child => {
        const parentId = child.parentProduct;
        if (parentId && parentIds.has(parentId)) {
          if (!childrenByParent[parentId]) {
            childrenByParent[parentId] = [];
          }
          childrenByParent[parentId].push(child);
        }
      });

      // Add children to parent products
      const enrichedParents = parents.map(parent => ({
        ...parent,
        children: childrenByParent[parent._id] || []
      }));

      // Add orphaned children as standalone products
      const orphanedAsStandalone = orphanedChildren.map(child => ({
        ...child,
        children: [],
        isOrphaned: true
      }));

      const allDisplayProducts = [...enrichedParents, ...orphanedAsStandalone];
      setParentProducts(allDisplayProducts);
      setProducts(allProducts);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Generate barcodes using JsBarcode (matching HTML version approach)
  const generateBarcodeRef = useRef();
  
  const renderBarcode = (element, code) => {
    if (!element || !code || !window.JsBarcode) return;
    
    try {
      // Clear any existing content
      element.innerHTML = '';
      
      window.JsBarcode(element, code, {
        format: "CODE128",
        width: 1.3,
        height: 38,
        displayValue: false,
        margin: 2,
        background: 'transparent',
        lineColor: '#000000',
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 2,
        fontSize: 10,
        fontOptions: "",
        font: "monospace",
        valid: function(valid) {
          if (!valid) {
            console.warn('Invalid barcode for code:', code);
          }
        }
      });
    } catch (error) {
      console.error('Barcode generation error:', error);
      // Fallback display
      element.innerHTML = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="8" fill="#666">Invalid Code</text>`;
    }
  };

  // Calculate EAN-13 check digit
  const calculateEAN13CheckDigit = (code) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code[i]);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    return (10 - (sum % 10)) % 10;
  };

  // Generate SVG barcode as fallback
  const generateSVGBarcode = (code) => {
    const barcodeData = code.replace(/[^0-9]/g, '').padStart(12, '0').substring(0, 12);
    const checkDigit = calculateEAN13CheckDigit(barcodeData);
    const fullBarcode = barcodeData + checkDigit;
    
    // Simple EAN-13 pattern generation
    const patterns = {
      'L': ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'],
      'G': ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'],
      'R': ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
    };
    
    const firstDigitPatterns = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
    
    let svg = '<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">';
    svg += '<rect width="200" height="50" fill="white"/>';
    
    let x = 10;
    const barWidth = 1.5;
    
    // Start guard
    svg += `<rect x="${x}" y="5" width="${barWidth}" height="35" fill="black"/>`;
    x += barWidth * 2;
    svg += `<rect x="${x}" y="5" width="${barWidth}" height="35" fill="black"/>`;
    x += barWidth * 2;
    
    // Left group
    const firstDigit = parseInt(fullBarcode[0]);
    const leftPattern = firstDigitPatterns[firstDigit];
    
    for (let i = 1; i <= 6; i++) {
      const digit = parseInt(fullBarcode[i]);
      const pattern = patterns[leftPattern[i-1]][digit];
      
      for (let j = 0; j < 7; j++) {
        if (pattern[j] === '1') {
          svg += `<rect x="${x}" y="5" width="${barWidth}" height="35" fill="black"/>`;
        }
        x += barWidth;
      }
    }
    
    // Center guard
    x += barWidth;
    svg += `<rect x="${x}" y="5" width="${barWidth}" height="35" fill="black"/>`;
    x += barWidth * 2;
    svg += `<rect x="${x}" y="5" width="${barWidth}" height="35" fill="black"/>`;
    x += barWidth * 2;
    
    // Right group
    for (let i = 7; i <= 12; i++) {
      const digit = parseInt(fullBarcode[i]);
      const pattern = patterns['R'][digit];
      
      for (let j = 0; j < 7; j++) {
        if (pattern[j] === '1') {
          svg += `<rect x="${x}" y="5" width="${barWidth}" height="35" fill="black"/>`;
        }
        x += barWidth;
      }
    }
    
    // End guard
    svg += `<rect x="${x}" y="5" width="${barWidth}" height="35" fill="black"/>`;
    x += barWidth * 2;
    svg += `<rect x="${x}" y="5" width="${barWidth}" height="35" fill="black"/>`;
    
    svg += '</svg>';
    
    return 'data:image/svg+xml;base64,' + btoa(svg);
  };

  // Format date to match template
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Calculate age in days
  const calculateAge = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days`;
  };

  // Filter products based on search
  const filteredProducts = parentProducts.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const toggleBundle = (productId) => {
    const newExpanded = new Set(expandedBundles);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedBundles(newExpanded);
  };

  const toggleSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    const product = parentProducts.find(p => p._id === productId);
    
    if (newSelected.has(productId)) {
      // Deselecting - remove product and all its children
      newSelected.delete(productId);
      if (product?.children) {
        product.children.forEach(child => newSelected.delete(child._id));
      }
    } else {
      // Selecting - add product and all its children
      newSelected.add(productId);
      if (product?.children) {
        product.children.forEach(child => newSelected.add(child._id));
      }
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === getAllSelectableProducts().length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(getAllSelectableProducts()));
    }
  };

  const getAllSelectableProducts = () => {
    const allIds = [];
    currentProducts.forEach(product => {
      allIds.push(product._id);
      if (product.children) {
        product.children.forEach(child => allIds.push(child._id));
      }
    });
    return allIds;
  };

  const printSelected = () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select products to print');
      return;
    }

    const selectedProductsData = [];
    // Get all products (parents and children) that are selected
    parentProducts.forEach(parent => {
      if (selectedProducts.has(parent._id)) {
        selectedProductsData.push(parent);
      }
      if (parent.children) {
        parent.children.forEach(child => {
          if (selectedProducts.has(child._id)) {
            selectedProductsData.push(child);
          }
        });
      }
    });

    if (selectedProductsData.length === 0) {
      toast.error('No products selected to print');
      return;
    }

    const generateStickerHTML = (list) => {
      const styles = `
        <style>
          body {
            display: flex;
            flex-wrap: wrap;
            font-family: Arial, sans-serif;
            padding: 10px;
          }
          .sticker {
            width: 6.3cm;
            height: 4cm;
            margin: 0.3cm;
            padding: 0.4cm;
            border-radius: 8px;
            background: white;
            box-shadow: 0 0 2px rgba(0,0,0,0.1);
            box-sizing: border-box;
          }
          .shop-name {
            font-size: 14px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
          }
          .brand-code {
            font-size: 14px;
            font-weight: bold;
            background: linear-gradient(to right, #79c2ff, #a5f2c3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .info {
            font-size: 12px;
            margin-top: 4px;
          }
          .red-line {
            border-top: 1px solid red;
            margin: 4px 0;
          }
          .barcode {
            text-align: center;
          }
          .barcode svg {
            max-width: 100%;
            height: auto;
          }
          .barcode-code {
            text-align: center;
            font-size: 10px;
            margin-top: 2px;
            letter-spacing: 2px;
            font-weight: bold;
          }
          @page {
            size: A4;
            margin: 0.5cm;
          }
        </style>
      `;

      const body = list.map((p, i) => `
        <div class="sticker">
          <div class="shop-name">
            <span>${p.vendor?.name || 'TATE The Brand'}</span>
            <span class="brand-code">${p.vendor?.code || ''}</span>
          </div>
          <div class="info">
            <div><strong>MRP:</strong> ₹${p.pricing?.mrp || 0}</div>
            <div><strong>Discounted:</strong> ₹${p.pricing?.discountedPrice || 0}</div>
          </div>
          <div class="red-line"></div>
          <div class="barcode">
            <svg id="barcode-${i}"></svg>
            <div class="barcode-code">${p.code}</div>
          </div>
        </div>
      `).join("");

      const scripts = `
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          ${list.map((p, i) => `
            JsBarcode("#barcode-${i}", "${p.code}", {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: false
            });
          `).join("")}
          setTimeout(() => window.print(), 1000);
        </script>
      `;

      return `<!DOCTYPE html><html><head><title>Print</title>${styles}</head><body>${body}${scripts}</body></html>`;
    };

    const printWindow = window.open('', 'PRINT', 'width=800,height=600');
    printWindow.document.write(generateStickerHTML(selectedProductsData));
    printWindow.document.close();
  };

  const printSingleProduct = (product) => {
    const generateStickerHTML = (p) => {
      const styles = `
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
            padding: 20px;
            min-height: 100vh;
          }
          .sticker {
            width: 6.3cm;
            height: 4cm;
            padding: 0.4cm;
            border-radius: 8px;
            background: white;
            box-shadow: 0 0 2px rgba(0,0,0,0.1);
            box-sizing: border-box;
          }
          .shop-name {
            font-size: 14px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
          }
          .brand-code {
            font-size: 14px;
            font-weight: bold;
            background: linear-gradient(to right, #79c2ff, #a5f2c3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .info {
            font-size: 12px;
            margin-top: 4px;
          }
          .red-line {
            border-top: 1px solid red;
            margin: 4px 0;
          }
          .barcode {
            text-align: center;
          }
          .barcode svg {
            max-width: 100%;
            height: auto;
          }
          .barcode-code {
            text-align: center;
            font-size: 10px;
            margin-top: 2px;
            letter-spacing: 2px;
            font-weight: bold;
          }
          @page {
            size: A4;
            margin: 0.5cm;
          }
        </style>
      `;

      const body = `
        <div class="sticker">
          <div class="shop-name">
            <span>${p.vendor?.name || 'TATE The Brand'}</span>
            <span class="brand-code">${p.vendor?.code || ''}</span>
          </div>
          <div class="info">
            <div><strong>MRP:</strong> ₹${p.pricing?.mrp || 0}</div>
            <div><strong>Discounted:</strong> ₹${p.pricing?.discountedPrice || 0}</div>
          </div>
          <div class="red-line"></div>
          <div class="barcode">
            <svg id="barcode-single"></svg>
            <div class="barcode-code">${p.code}</div>
          </div>
        </div>
      `;

      const scripts = `
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          JsBarcode("#barcode-single", "${p.code}", {
            format: "CODE128",
            width: 1.5,
            height: 40,
            displayValue: false
          });
          setTimeout(() => window.print(), 1000);
        </script>
      `;

      return `<!DOCTYPE html><html><head><title>Print - ${p.name}</title>${styles}</head><body>${body}${scripts}</body></html>`;
    };

    const printWindow = window.open('', 'PRINT', 'width=400,height=400');
    printWindow.document.write(generateStickerHTML(product));
    printWindow.document.close();
  };

  const deleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        toast.success('Product deleted successfully');
        loadProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const ProductRow = ({ product, index, isChild = false }) => {
    const globalIndex = indexOfFirstProduct + index + 1;
    const hasChildren = product.children && product.children.length > 0;

    // Make the entire parent row clickable for expansion/collapse
    const handleRowClick = (e) => {
      // Don't trigger row click if clicking on checkbox, buttons, or inputs
      if (e.target.type === 'checkbox' || e.target.closest('button') || e.target.closest('input')) {
        return;
      }
      if (hasChildren && !isChild) {
        toggleBundle(product._id);
      }
    };

    return (
      <tr
        key={product._id}
        className={isChild ? 'child-row' : (hasChildren ? 'parent-row' : '')}
        onClick={handleRowClick}
      >
        <td>{isChild ? '' : globalIndex}</td>
        <td>
          <input
            type="checkbox"
            checked={selectedProducts.has(product._id)}
            onChange={() => toggleSelection(product._id)}
            onClick={e => e.stopPropagation()}
          />
        </td>
        <td>
          {hasChildren && (
            <span className="toggle-icon">
              {expandedBundles.has(product._id) ? '➖' : '➕'}
            </span>
          )}
        </td>
        <td>{product.name}</td>
        <td>{product.code}</td>
        <td>{product.category?.name || '-'}</td>
        <td>{product.subcategory?.name || '-'}</td>
        <td>{product.specifications?.size || '-'}</td>
        <td>{product.specifications?.color || '-'}</td>
        <td>{product.type || '-'}</td>
        <td>{formatDate(product.createdAt)}</td>
        <td>{calculateAge(product.createdAt)}</td>
        <td>{(product.inventory?.currentStock || 0) + (product.totalSold || 0)}</td>
        <td>{product.inventory?.currentStock || 0}</td>
        <td>{product.totalSold || 0}</td>
        <td>₹{product.pricing?.factoryPrice || '-'}</td>
        <td>₹{product.pricing?.offerPrice || '-'}</td>
        <td>₹{product.pricing?.discountedPrice || '-'}</td>
        <td>{product.pricing?.mrp ? `₹${product.pricing.mrp}` : '-'}</td>
        <td>{product.isActive !== undefined ? (product.isActive ? 'Available' : 'Inactive') : '-'}</td>
        <td>
          <svg 
            ref={(el) => {
              if (el) {
                setTimeout(() => renderBarcode(el, product.code), 0);
              }
            }}
            className="barcode-label"
          />
        </td>
        <td>
          <button onClick={e => { e.stopPropagation(); printSingleProduct(product); }}>
            🖨️
          </button>
        </td>
        <td>
          <button onClick={e => { e.stopPropagation(); deleteProduct(product._id); }}>
            ❌
          </button>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fa', padding: '20px' }}>
      <style>{`
        .parent-row {
          background-color: rgba(0, 123, 255, 0.1) !important;
          cursor: pointer !important;
          font-weight: 500 !important;
        }
        .parent-row:hover {
          background-color: rgba(0, 123, 255, 0.3) !important;
        }
        .child-row {
          background-color: #f9fbff !important;
          border-bottom: 2px solid #d0eaff !important;
        }
        .child-row:hover {
          background-color: rgba(0, 123, 255, 0.3) !important;
        }
        .child-row td {
          padding-left: 12px !important;
          border-left: 3px solid #90caf9 !important;
        }
        table {
          min-width: 1500px;
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 10px 8px;
          text-align: center;
          font-size: 14px;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
        tr:hover {
          background-color: #f0f8ff;
        }
        .barcode-label {
          max-width: 160px;
          overflow: hidden;
          text-align: center;
        }
        .toggle-icon {
          display: inline-block;
          width: 16px;
          font-weight: bold;
          margin-right: 6px;
          color: #007bff;
        }
      `}</style>
      <div className="w-full" style={{ maxWidth: 'none', margin: '0', background: '#fff', padding: '20px', borderRadius: '0', boxShadow: 'none' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '24px', fontSize: '2rem', fontWeight: 'bold' }}>
            📋 Product List
          </h1>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="🔍 Search by name or code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              marginBottom: '20px',
              boxSizing: 'border-box'
            }}
          />

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            marginBottom: '20px',
            gap: '10px'
          }}>
            <button
              onClick={printSelected}
              style={{
                backgroundColor: '#0077cc',
                color: 'white',
                padding: '10px 18px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'background-color 0.3s ease',
                textAlign: 'center'
              }}
            >
              🖨️ Print Selected ({selectedProducts.size})
            </button>
            <button
              onClick={() => navigate('/products/add')}
              style={{
                backgroundColor: '#ccc',
                color: '#333',
                padding: '10px 18px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'background-color 0.3s ease',
                textAlign: 'center'
              }}
            >
              ➕ Add New Product
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                backgroundColor: '#ccc',
                color: '#333',
                padding: '10px 18px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'background-color 0.3s ease',
                textAlign: 'center'
              }}
            >
              🏠 Home
            </button>
          </div>
        </div>

        {/* Table Wrapper */}
        <div style={{
          overflowX: 'auto',
          marginTop: '10px',
          borderRadius: '8px'
        }}>
          <table style={{ minWidth: '1500px' }}>
            <thead>
                <tr>
                  <th>SL No.</th>
                  <th>Select</th>
                  <th>▼</th>
                  <th>Name</th>
                  <th>Product Code</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Age</th>
                  <th>Qty</th>
                  <th>Available</th>
                  <th>Sold</th>
                  <th>Factory</th>
                  <th>Offer</th>
                  <th>Discounted</th>
                  <th>MRP</th>
                  <th>Status</th>
                  <th>Barcode</th>
                  <th>Print</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product, index) => (
                  <React.Fragment key={product._id}>
                    <ProductRow product={product} index={index} />
                    {expandedBundles.has(product._id) && product.children?.map((child) => (
                      <ProductRow key={child._id} product={child} index={index} isChild={true} />
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="pagination-controls">
            <div className="page-numbers" style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#ccc' : '#eee',
                  color: '#333',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                « First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#ccc' : '#eee',
                  color: '#333',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                ‹ Prev
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: currentPage === pageNum ? '#0077cc' : '#eee',
                      color: currentPage === pageNum ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#ccc' : '#eee',
                  color: '#333',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Next ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#ccc' : '#eee',
                  color: '#333',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Last »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductsPage;

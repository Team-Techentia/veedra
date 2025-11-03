import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Search, X, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import comboService from '../../services/comboService';
import billingService from '../../services/billingService';
import paymentService from '../../services/paymentService';
import categoryService from '../../services/categoryService';

// Utility functions - matches reference implementation
const fmt = (n) => "₹" + Number(n || 0).toFixed(2);
const toNumber = (v) => {
  if (typeof v === "number") return v;
  if (v === "" || v == null) return 0;
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
};

function computeStatus({ validFrom, validTo, paused }) {
  const today = new Date();
  const start = validFrom ? new Date(validFrom) : null;
  const end = validTo ? new Date(validTo) : null;
  if (paused) return "paused";
  if (start && today < start) return "upcoming";
  if (end && today > end) return "expired";
  return "active";
}

// GST calculation function - reverse GST (GST is already included in price)
function calculateGSTBreakdown(totalAmount, items = []) {
  // Determine GST rate based on total bill amount (not individual items)
  const gstRate = totalAmount > 2500 ? 12 : 5; // 12% or 5%
  
  // Reverse GST calculation (GST is already included in the selling price)
  const gstAmount = (totalAmount * gstRate) / (100 + gstRate);
  const baseAmount = totalAmount - gstAmount;
  const sgst = gstAmount / 2;
  const cgst = gstAmount / 2;
  
  return {
    baseAmount: Math.round(baseAmount * 100) / 100,
    totalGST: Math.round(gstAmount * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    gstRate,
    sgstRate: gstRate / 2,
    cgstRate: gstRate / 2,
    // For compatibility with BillHistoryPage format
    sgst5: gstRate === 5 ? Math.round(sgst * 100) / 100 : 0,
    cgst5: gstRate === 5 ? Math.round(cgst * 100) / 100 : 0,
    sgst12: gstRate === 12 ? Math.round(sgst * 100) / 100 : 0,
    cgst12: gstRate === 12 ? Math.round(cgst * 100) / 100 : 0,
    totalWithoutGST: Math.round(baseAmount * 100) / 100
  };
}

const POSBillingPage = () => {
  // State management - aligned with reference implementation
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Cart state - matches reference structure
  const [cart, setCart] = useState([]); // Single products
  const [selectedCombos, setSelectedCombos] = useState([]); // Applied combos
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [qtyInput, setQtyInput] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Camera scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  
  // Payment state
  const [paymentAmounts, setPaymentAmounts] = useState({
    cash: 0,
    upi: 0
  });
  
  // Loading and processing states
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  
  // Cart item ID generator for unique tracking
  const [nextCartItemId, setNextCartItemId] = useState(1);
  
  // Refs
  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const scannerRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Focus on barcode input when component mounts
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Migrate existing cart items to have cartItemId
  useEffect(() => {
    if (cart.some(item => !item.cartItemId)) {
      setCart(prev => prev.map(item => 
        item.cartItemId ? item : { ...item, cartItemId: nextCartItemId }
      ));
      setNextCartItemId(prev => prev + cart.filter(item => !item.cartItemId).length);
    }
  }, [cart, nextCartItemId]);

  // Load QuaggaJS dynamically
  useEffect(() => {
    const loadQuagga = async () => {
      try {
        // Load QuaggaJS from CDN
        if (!window.Quagga) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/@ericblade/quagga2@1.2.6/dist/quagga.min.js';
          script.async = true;
          script.onload = () => {
            console.log('QuaggaJS loaded successfully');
          };
          script.onerror = () => {
            console.error('Failed to load QuaggaJS');
            setCameraError('Camera scanning not available');
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('Error loading QuaggaJS:', error);
        setCameraError('Camera scanning not available');
      }
    };

    loadQuagga();

    // Cleanup function to stop scanning when component unmounts
    return () => {
      if (window.Quagga && isScanning) {
        window.Quagga.stop();
      }
    };
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (window.Quagga && isScanning) {
        window.Quagga.stop();
        setIsScanning(false);
      }
    };
  }, [isScanning]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, combosData, categoriesData] = await Promise.all([
        productService.getProducts(),
        comboService.getCombos(),
        categoryService.getCategories()
      ]);
      setProducts(productsData.data || productsData || []);
      setCombos(combosData.data || combosData || []);
      setCategories(categoriesData.data || categoriesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Product search and filtering - matches reference
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.productCode && product.productCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    
    const matchesCategory = !selectedCategory || product.category?._id === selectedCategory;
    
    return matchesSearch && matchesCategory && product.isActive && (product.inventory?.currentStock || 0) > 0;
  });

  // Find product by code/barcode - matches reference
  const findProductByCode = (code) => {
    return products.find(p => 
      (p.code || p.sku || p.productCode || "").toString() === code.toString() ||
      (p.barcode || "").toString() === code.toString()
    );
  };

  // Handle barcode input - matches reference Enter key behavior
  const handleBarcodeInput = async (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      
      const product = findProductByCode(barcodeInput.trim());
      
      if (product) {
        if ((product.inventory?.currentStock || 0) <= 0) {
          toast.error('Product is out of stock!');
        } else {
          assignScannedProduct(product, qtyInput);
        }
      } else {
        // Allow manual product entry - matches reference behavior
        if (window.confirm("Product not found in catalog. Add as free-text single item?")) {
          const customName = window.prompt("Enter product name:") || ("Item " + barcodeInput);
          const customPrice = Number(window.prompt("Enter MRP:") || 0);
          
          const customProduct = {
            _id: 'custom_' + Date.now(),
            name: customName,
            productCode: barcodeInput,
            pricing: { 
              offerPrice: customPrice,
              discountedPrice: null // Custom products don't have discounted price
            },
            inventory: { currentStock: 999 },
            isActive: true
          };
          
          // Add to products temporarily
          setProducts(prev => [...prev, customProduct]);
          assignScannedProduct(customProduct, qtyInput);
        }
      }
      
      setBarcodeInput('');
      setQtyInput(1);
    }
  };

  // Assignment logic - Auto-assign to active combo first
  const assignScannedProduct = (product, qty = 1) => {
    // Check stock availability first
    const currentStock = product.inventory?.currentStock || 0;
    if (currentStock < qty) {
      toast.error(`Insufficient stock! Available: ${currentStock}`);
      return;
    }

    let assigned = false;
    // Use discounted price for combo slot validation
    const productMRP = product.pricing?.discountedPrice || product.pricing?.offerPrice || product.price || 0;
    // Strategy: Try most recent combo first (last added), then work backwards
    for (let comboIndex = selectedCombos.length - 1; comboIndex >= 0; comboIndex--) {
      const combo = selectedCombos[comboIndex];
      
      // Find unfilled slots in this combo
      const unfilledSlots = combo.slots?.filter(slot => !slot.assigned) || [];
      
      if (unfilledSlots.length === 0) continue; // Skip filled combos
      
      // Try to find the first available slot that accepts this product
      for (let slot of unfilledSlots) {
        const minPrice = slot.minPrice || 0;
        const maxPrice = slot.maxPrice || 999999;
        
        // Get the appropriate price for comparison (discounted price first, then offer price)
        const productPrice = Number(product.pricing?.discountedPrice || product.pricing?.offerPrice || 0);
        
        // Accept if no price constraints or within range
        const fitsSlot = (minPrice === 0 && maxPrice === 0) || 
                        (productPrice >= minPrice && productPrice <= maxPrice);
        
        if (fitsSlot) {
          // Assign product to this slot
          // Find an available cart item for this product (not already fully assigned to combos)
          const assignedCartItemQuantities = new Map();
          
          // Calculate how much of each cartItemId is already assigned to other combos
          selectedCombos.forEach((otherCombo, otherIndex) => {
            if (otherIndex !== comboIndex && otherCombo.slots) {
              otherCombo.slots.forEach(otherSlot => {
                if (otherSlot.assigned && otherSlot.assigned.cartItemId) {
                  const cartItemId = otherSlot.assigned.cartItemId;
                  const assignedQty = otherSlot.assigned.qty || 1;
                  assignedCartItemQuantities.set(cartItemId, (assignedCartItemQuantities.get(cartItemId) || 0) + assignedQty);
                }
              });
            }
          });
          
          // Find a cart item with available quantity
          let availableCartItem = null;
          const matchingCartItems = cart.filter(item => item._id === product._id);
          
          for (const cartItem of matchingCartItems) {
            const assignedQty = assignedCartItemQuantities.get(cartItem.cartItemId) || 0;
            const availableQty = cartItem.quantity - assignedQty;
            
            if (availableQty > 0) {
              availableCartItem = cartItem;
              break;
            }
          }
          
          // If no cart items found, automatically add the product to cart
          if (!availableCartItem && matchingCartItems.length === 0) {
            // Check stock first
            const currentStock = product.inventory?.currentStock || 0;
            if (currentStock > 0) {
              // Add product to cart
              const newCartItem = {
                ...product,
                quantity: 1,
                price: product.pricing?.discountedPrice || product.pricing?.offerPrice || product.price || 0,
                isComboApplied: false,
                cartItemId: nextCartItemId
              };
              
              setCart(prev => [...prev, newCartItem]);
              setNextCartItemId(prev => prev + 1);
              
              availableCartItem = newCartItem;
              toast.success(`Added ${product.name} to cart for combo`);
            } else {
              toast.error(`${product.name} is out of stock`);
              break;
            }
          }
          
          if (availableCartItem) {
            slot.assigned = {
              product: product,
              qty: 1, // Only 1 unit gets combo pricing
              cartItemId: availableCartItem.cartItemId
            };
            
            // Update selectedCombos
            setSelectedCombos(prev => prev.map((c, idx) => 
              idx === comboIndex ? combo : c
            ));
          } else {
            toast.error(`Not enough quantity available for ${product.name} in cart`);
            break;
          }
          
          assigned = true;
          
          // Check if combo is now complete
          const isComboComplete = combo.slots?.every(s => s.assigned);
          if (isComboComplete) {
            // Combo completed - no notification needed
          } else {
            const remainingSlots = combo.slots?.filter(s => !s.assigned).length || 0;

          }
          
          break;
        }
      }
      
      if (assigned) break;
    }

  if (!assigned) {
      // Add to single products
      const existingItem = cart.find(item => item._id === product._id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + qty;
        const availableStock = product.inventory?.currentStock || 0;
        
        if (newQuantity <= availableStock) {
          setCart(prev => prev.map(item =>
            item._id === product._id
              ? { ...item, quantity: newQuantity }
              : item
          ));
          toast.success(`Updated ${product.name} quantity to ${newQuantity}`);
        } else {
          toast.error(`Insufficient stock! Available: ${availableStock}, Requested: ${newQuantity}`);
        }
      } else {
        const availableStock = product.inventory?.currentStock || 0;
        
        if (qty <= availableStock) {
          setCart(prev => [...prev, {
            ...product,
            quantity: qty,
            price: product.pricing?.offerPrice || product.price || 0,
            isComboApplied: false,
            cartItemId: nextCartItemId
          }]);
          setNextCartItemId(prev => prev + 1);
          toast.success(`Added ${product.name} to cart`);
        } else {
          toast.error(`Insufficient stock! Available: ${availableStock}, Requested: ${qty}`);
        }
      }
    }
  };

  // Add combo to bill - Auto-assignment enabled
  const addComboToBill = (combo) => {
    const status = computeStatus({
      validFrom: combo.validFrom,
      validTo: combo.validTo,
      paused: combo.paused
    });
    
    if (status !== 'active') {

      return;
    }

    // Check if combo is already applied
    if (selectedCombos.find(c => c._id === combo._id)) {
      // Allow multiple instances of the same combo
    }

    // Create combo instance with empty slots
    const slots = (combo.rules?.slots || []).map(slot => ({
      minPrice: Number(slot.minPrice || 0),
      maxPrice: Number(slot.maxPrice || 0),
      assigned: null
    }));

    const comboInstance = {
      _id: combo._id,
      sku: combo.sku,
      name: combo.name,
      offerPrice: Number(combo.offerPrice || 0),
      qtyProducts: Number(combo.qtyProducts || slots.length || 0),
      slots: slots,
      notes: combo.notes || ""
    };

    setSelectedCombos(prev => [...prev, comboInstance]);
    
    // Enhanced feedback
    const slotCount = slots.length;

    
    // Auto-focus search input for immediate product scanning
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  };

  // Remove combo - matches reference
  const removeComboInstance = (comboToRemove) => {
    if (!window.confirm("Remove this combo from the bill?")) return;
    
    // Move assigned products back to singles
    comboToRemove.slots?.forEach(slot => {
      if (slot.assigned) {
        const product = slot.assigned.product;
        const qty = slot.assigned.qty;
        
        // Add back to cart as single
        const existingItem = cart.find(item => item._id === product._id);
        if (existingItem) {
          setCart(prev => prev.map(item =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + qty }
              : item
          ));
        } else {
          setCart(prev => [...prev, {
            ...product,
            quantity: qty,
            price: product.pricing?.offerPrice || 0,
            isComboApplied: false,
            cartItemId: nextCartItemId
          }]);
          setNextCartItemId(prev => prev + 1);
        }
      }
    });
    
    // Remove combo
    setSelectedCombos(prev => prev.filter(combo => combo._id !== comboToRemove._id));

  };

  // Update quantity
 const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p._id === productId);
    const availableStock = product?.inventory?.currentStock || 0;
    
    if (!product) {
      toast.error('Product not found');
      return;
    }
    
    if (newQuantity > availableStock) {
      toast.error(`Insufficient stock! Available: ${availableStock}`);
      return;
    }

    setCart(prev => prev.map(item =>
      item._id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };


  


  // Get combo assignments map
  const getComboAssignments = () => {
    const assignedCartItemQuantities = new Map();
    selectedCombos.forEach(combo => {
      if (combo.slots) {
        combo.slots.forEach(slot => {
          if (slot.assigned && slot.assigned.cartItemId) {
            const cartItemId = slot.assigned.cartItemId;
            const assignedQty = slot.assigned.qty || 1;
            assignedCartItemQuantities.set(cartItemId, (assignedCartItemQuantities.get(cartItemId) || 0) + assignedQty);
          }
        });
      }
    });
    return assignedCartItemQuantities;
  };

  // Get remaining singles quantity for a cart item
  const getSinglesQuantity = (cartItem) => {
    const assignedQty = getComboAssignments().get(cartItem.cartItemId) || 0;
    return Math.max(0, cartItem.quantity - assignedQty);
  };

  // Show warning when combos consume all items (but don't auto-fix)
  const checkSinglesAvailability = () => {
    const assignedCartItemQuantities = getComboAssignments();

    // Check if any cart items are fully consumed by combos
    const consumedItems = [];
    cart.forEach(item => {
      const assignedQty = assignedCartItemQuantities.get(item.cartItemId) || 0;
      const quantityForSingles = Math.max(0, item.quantity - assignedQty);
      
      if (quantityForSingles === 0 && assignedQty > 0) {
        consumedItems.push(item.name);
      }
    });

    return consumedItems;
  };

    // Calculate totals using cart item IDs for precise tracking
  const calculateSinglesSubtotal = () => {
    // Get set of cart item IDs that are assigned to combos with their assigned quantities
    const assignedCartItemQuantities = new Map();
    selectedCombos.forEach(combo => {
      if (combo.slots) {
        combo.slots.forEach(slot => {
          if (slot.assigned && slot.assigned.cartItemId) {
            const cartItemId = slot.assigned.cartItemId;
            const assignedQty = slot.assigned.qty || 1;
            assignedCartItemQuantities.set(cartItemId, (assignedCartItemQuantities.get(cartItemId) || 0) + assignedQty);
          }
        });
      }
    });

    let singlesTotal = 0;
    
    cart.forEach(item => {
      // Calculate remaining quantity after combo assignments
      const assignedQty = assignedCartItemQuantities.get(item.cartItemId) || 0;
      const quantityForSingles = Math.max(0, item.quantity - assignedQty);
      
      // Always use offer price for singles
      const singlePrice = Number(item.pricing?.offerPrice || item.price || 0);
      singlesTotal += quantityForSingles * singlePrice;
    });
    
    return singlesTotal;
  };  const calculateCombosSubtotal = () => {
    const combosTotal = selectedCombos.reduce((sum, combo) => {
      const allSlotsFilled = combo.slots?.every(slot => slot.assigned) || false;
      const comboPrice = allSlotsFilled ? Number(combo.offerPrice || 0) : 0;
      return sum + comboPrice;
    }, 0);
    
    return combosTotal;
  };

  // Calculate adjusted price for a product in a combo using the formula:
  // Adjusted Price = (Product MRP / Total MRP) × Combo Price
const calculateAdjustedPrice = (combo, slot) => {
  if (!combo || !slot || !slot.assigned) return 0;
  
  const allSlotsFilled = combo.slots?.every(s => s.assigned) || false;
  if (!allSlotsFilled) {
    return Number(slot.assigned.product.pricing?.offerPrice || 0);
  }
  
  // Calculate total MRP of all assigned products
  const totalMRP = combo.slots.reduce((sum, s) => {
    if (s.assigned) {
      const price = Number(s.assigned.product.pricing?.offerPrice || 0);
      const qty = s.assigned.qty || 1;
      return sum + (price * qty);
    }
    return sum;
  }, 0);
   if (totalMRP === 0) return 0;
  
  // Calculate: (Product Price × Qty / Total MRP) × Combo Offer Price
  const productPrice = Number(slot.assigned.product.pricing?.offerPrice || 0);
  const productQty = slot.assigned.qty || 1;
  const productMRP = productPrice * productQty;
  const comboPrice = Number(combo.offerPrice || 0);
  
  const adjustedPrice = (productMRP / totalMRP) * comboPrice;
  
  // Return per-unit adjusted price
  return Math.round(adjustedPrice / productQty);
};

  const calculateTotalSavings = () => {
    return selectedCombos.reduce((totalSavings, combo) => {
      const allSlotsFilled = combo.slots?.every(slot => slot.assigned) || false;
      if (!allSlotsFilled) return totalSavings;
      
      // Calculate original total MRP
      const sumMRP = combo.slots.reduce((sum, slot) => {
        if (slot.assigned) {
          return sum + Number(slot.assigned.product.pricing?.offerPrice || 0) * (slot.assigned.qty || 1);
        }
        return sum;
      }, 0);
      
      // Savings = Original Total - Combo Offer Price
      return totalSavings + Math.max(0, sumMRP - Number(combo.offerPrice || 0));
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateSinglesSubtotal() + calculateCombosSubtotal();
  };

  // Camera scanning functions
  const startCameraScanning = async () => {
    if (isScanning) return;
    
    // Check for camera permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
    } catch (error) {
      toast.error('Camera permission denied or not available');
      setCameraError('Camera access denied');
      return;
    }
    
    if (!window.Quagga) {
      toast.error('Camera scanning not available. QuaggaJS not loaded.');
      return;
    }

    if (!scannerRef.current) {
      toast.error('Scanner element not found');
      return;
    }

    setIsScanning(true);
    setCameraError('');

    const config = {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: { min: 160, ideal: 320 },
          height: { min: 120, ideal: 240 },
          aspectRatio: { min: 1, max: 2 },
          facingMode: "environment" // Use back camera if available
        }
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader"
        ],
        debug: {
          drawBoundingBox: false,
          showFrequency: false,
          drawScanline: false,
          showPattern: false
        }
      },
      locate: true,
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: navigator.hardwareConcurrency || 4,
      frequency: 10,
      debug: false
    };

    window.Quagga.init(config, (err) => {
      if (err) {
        console.error('Quagga initialization error:', err);
        setIsScanning(false);
        setCameraError('Camera initialization failed');
        toast.error('Camera initialization failed: ' + (err.message || 'Unknown error'));
        return;
      }
      
      console.log('Quagga initialized successfully');
      window.Quagga.start();
      toast.success('Camera scanning started - Point at barcode');
    });

    // Handle barcode detection
    window.Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      console.log('Barcode detected:', code);
      
      // Validate barcode (basic check)
      if (code && code.length >= 3) {
        // Set the barcode input and trigger product search
        setBarcodeInput(code);
        
        // Auto-add the product
        setTimeout(() => {
          handleBarcodeInput({ key: 'Enter', preventDefault: () => {} });
        }, 100);
        
        // Stop scanning after detection to avoid duplicates
        stopCameraScanning();
        
        // Visual feedback
        toast.success(`Scanned: ${code}`);
      } else {
        console.warn('Invalid barcode detected:', code);
      }
    });

    // Handle processing errors
    window.Quagga.onProcessed((result) => {
      if (result && result.boxes) {
        // Could add visual feedback here if needed
      }
    });
  };

  const stopCameraScanning = () => {
    if (!isScanning) return;
    
    if (window.Quagga) {
      try {
        window.Quagga.stop();
        window.Quagga.offDetected();
        window.Quagga.offProcessed();
        console.log('Camera scanning stopped');
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }
    
    setIsScanning(false);
    toast.info('Camera scanning stopped');
  };

  // Request camera permissions
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 320 },
          height: { ideal: 240 }
        } 
      });
      
      // Stop the stream immediately as we just wanted to get permission
      stream.getTracks().forEach(track => track.stop());
      
      setCameraError('');
      toast.success('Camera permission granted');
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      
      let errorMessage = 'Camera access denied';
      if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera already in use';
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // Clear bill
  const clearBill = () => {
    if (!window.confirm("Clear the current bill?")) return;
    
    // Stop scanning if active
    if (isScanning) {
      stopCameraScanning();
    }
    
    setCart([]);
    setSelectedCombos([]);
    setCustomerInfo({ name: '', phone: '' });
    setPaymentAmounts({ cash: 0, upi: 0 });
    setBarcodeInput('');
    setSearchTerm('');
    
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // Finalize and print - matches reference
  // Finalize and print - FIXED VERSION
const finalizeAndPrint = async () => {
  if (cart.length === 0 && selectedCombos.length === 0) {
    toast.error('Cart is empty');
    return;
  }

  // Validate customer info
  const mobile = customerInfo.phone.trim();
  const name = customerInfo.name.trim() || "Customer";
  
  if (mobile && !/^\d{10}$/.test(mobile)) {
    if (!window.confirm("Customer mobile invalid. Continue without saving customer?")) return;
  }

  const totalAmount = calculateGrandTotal();
  const paidAmount = Number(paymentAmounts.cash) + Number(paymentAmounts.upi);
  
  if (paidAmount < totalAmount) {
    if (!window.confirm(`Paid amount ₹${paidAmount.toFixed(2)} is less than bill total ₹${totalAmount.toFixed(2)}. Proceed and record as due?`)) return;
  }

  // Prevent double-clicking
  if (processing) {
    console.log('⚠️ Already processing payment, ignoring duplicate request');
    return;
  }
  
  setProcessing(true);
  
  try {
    console.log('✅ Starting bill generation...');
    
    // Prepare final items for billing
    const finalItems = [];
    
    // Get set of cart item IDs that are assigned to combos
    const assignedCartItemQuantities = new Map();
    selectedCombos.forEach(combo => {
      if (combo.slots) {
        combo.slots.forEach(slot => {
          if (slot.assigned && slot.assigned.cartItemId) {
            const cartItemId = slot.assigned.cartItemId;
            const assignedQty = slot.assigned.qty || 1;
            assignedCartItemQuantities.set(cartItemId, (assignedCartItemQuantities.get(cartItemId) || 0) + assignedQty);
          }
        });
      }
    });
    
    // Add single products
    cart.forEach(item => {
      const assignedQty = assignedCartItemQuantities.get(item.cartItemId) || 0;
      const quantityForSingles = Math.max(0, item.quantity - assignedQty);
      
      if (quantityForSingles > 0) {
        finalItems.push({
          ...item,
          quantity: quantityForSingles,
          price: item.pricing?.offerPrice || item.price || 0,
          originalPrice: item.pricing?.mrp || item.price || 0,
          isComboApplied: false
        });
      }
    });
    
    // Add combo products with adjusted pricing
    selectedCombos.forEach(combo => {
      const allSlotsFilled = combo.slots?.every(slot => slot.assigned) || false;
      if (allSlotsFilled) {
        combo.slots.forEach(slot => {
          if (slot.assigned) {
            const adjustedPrice = calculateAdjustedPrice(combo, slot);
            
            finalItems.push({
              ...slot.assigned.product,
              quantity: slot.assigned.qty,
              price: adjustedPrice,
              originalPrice: slot.assigned.product.pricing?.discountedPrice || slot.assigned.product.pricing?.offerPrice || 0,
              isComboApplied: true,
              appliedComboName: combo.name,
              comboPrice: adjustedPrice
            });
          }
        });
      }
    });

    // Separate items for bill
    const singlesItems = finalItems.filter(item => !item.isComboApplied);
    const comboItems = finalItems.filter(item => item.isComboApplied);

    // Create bill data structure
    const billData = {
      billNumber: `B${Date.now()}`,
      transactionId: `TXN${Date.now()}`,
      date: new Date(),
      customer: {
        name: name,
        phone: mobile
      },
      items: finalItems,
      singlesItems: singlesItems,
      comboItems: comboItems,
      subtotal: calculateSinglesSubtotal(),
      combosTotal: calculateCombosSubtotal(),
      total: totalAmount,
      discount: calculateTotalSavings(),
      paymentMethod: paymentAmounts.cash > 0 && paymentAmounts.upi > 0 ? 'mix' : 
                    paymentAmounts.cash > 0 ? 'cash' : 'upi',
      receivedAmount: paidAmount,
      change: Math.max(0, paidAmount - totalAmount),
      combos: selectedCombos.filter(combo => combo.slots?.every(slot => slot.assigned))
    };
    
    console.log('💾 Bill data prepared:', billData);
    
    // Try to save to backend (optional - don't block printing)
    try {
      const paymentData = {
        customer: {
          name: name,
          phone: mobile,
          email: ''
        },
        items: finalItems.map(item => ({
          product: item._id,
          productName: item.name,
          productCode: item.productCode || item.code || 'N/A',
          quantity: item.quantity,
          unitPrice: item.price,
          mrp: item.originalPrice || item.price,
          totalAmount: item.price * item.quantity,
          tax: 0,
          discount: item.isComboApplied ? (item.originalPrice - item.price) : 0,
          comboAssignment: item.isComboApplied ? {
            isComboItem: true,
            comboName: item.appliedComboName
          } : null
        })),
        totals: {
          subtotal: billData.subtotal + billData.combosTotal,
          totalTax: 0,
          totalDiscount: billData.discount,
          grandTotal: totalAmount,
          finalAmount: totalAmount
        },
        payment: {
          method: billData.paymentMethod,
          amount: totalAmount,
          receivedAmount: paidAmount,
          changeGiven: billData.change,
          transactionId: billData.transactionId,
          status: 'paid',
          mixPaymentDetails: paymentAmounts.cash > 0 && paymentAmounts.upi > 0 ? {
            cash: Number(paymentAmounts.cash),
            upi: Number(paymentAmounts.upi)
          } : null
        },
        status: 'completed'
      };

      console.log('📤 Sending to backend...');
      const response = await billingService.createBill(paymentData);
      
      if (response.success && response.data) {
        billData.billNumber = response.data.billNumber;
        billData.transactionId = response.data.transactionId;
        console.log('✅ Backend save successful:', response.data.billNumber);
      }
    } catch (backendError) {
      console.warn('⚠️ Backend save failed, continuing with offline bill:', backendError);
      // Continue with offline bill - don't stop the process
    }
    
    // ✅ STOCK REDUCTION - Reduce stock for all items after bill is saved
    try {
      console.log('📦 Reducing stock for sold items...');
      
      const stockUpdatePromises = finalItems.map(async (item) => {
        // Skip custom products (manually added items)
        if (item._id && !item._id.toString().startsWith('custom_')) {
          try {
            // Update product stock
            await productService.updateStock(item._id, item.quantity, 'subtract');
            console.log(`✅ Stock reduced for ${item.name}: -${item.quantity}`);
            
            // If product has parent (variant case), update parent stock too
            const product = products.find(p => p._id === item._id);
            if (product?.parentProduct) {
              await productService.updateStock(product.parentProduct, item.quantity, 'subtract');
              console.log(`✅ Parent stock reduced for ${item.name}: -${item.quantity}`);
            }
          } catch (stockError) {
            console.warn(`⚠️ Failed to update stock for ${item.name}:`, stockError);
          }
        }
      });
      
      // Wait for all stock updates to complete
      await Promise.all(stockUpdatePromises);
      
      // Reload products to get updated stock levels
      const updatedProducts = await productService.getProducts();
      setProducts(updatedProducts.data || updatedProducts || []);
      
      console.log('✅ Stock updated successfully for all items');
    } catch (stockError) {
      console.error('⚠️ Stock update failed:', stockError);
      toast.warning('Bill saved but stock update failed. Please check inventory manually.');
    }
    
    // Show success message
    toast.success('💾 Bill generated successfully!');
    
    // Set bill data for receipt
    setLastBill(billData);
    
    // Ask user about printing
    const printChoice = window.confirm('💾 Bill generated!\n\n🖨 Click OK to PRINT\n📄 Click Cancel to skip print');
    
    if (printChoice) {
      console.log('🖨 User chose to print');
      // Small delay to ensure state is updated
      setTimeout(() => {
        printReceiptWithAutoPrint(billData);
        toast.success('Bill sent to printer!');
      }, 200);
    } else {
      console.log('📄 User skipped printing');
      toast.info('Bill saved (no print)');
    }
    
    // Clear bill after delay
    setTimeout(() => {
      clearBill();
      setLastBill(null);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error in finalizeAndPrint:', error);
    toast.error('Failed to generate bill: ' + error.message);
  } finally {
    setProcessing(false);
  }
};

  // Print receipt with provided data
  const printReceiptWithData = (billData) => {
    if (!billData) {
      console.error('No bill data provided to printReceiptWithData');
      toast.error('Cannot print: No bill data available');
      return;
    }
    
    const receiptHTML = generateReceiptHTML(billData);
    
    if (!receiptHTML) {
      console.error('Failed to generate receipt HTML');
      toast.error('Cannot print: Failed to generate receipt');
      return;
    }
    
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
      toast.error('Unable to open print window. Popup blocked?');
      return;
    }
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
  };

  // Print receipt with auto-print command
  const printReceiptWithAutoPrint = (billData) => {
    if (!billData) {
      console.error('No bill data provided to printReceiptWithAutoPrint');
      toast.error('Cannot print: No bill data available');
      return;
    }
    
    const receiptHTML = generateReceiptHTML(billData, true); // Pass true for auto-print
    
    if (!receiptHTML) {
      console.error('Failed to generate receipt HTML');
      toast.error('Cannot print: Failed to generate receipt');
      return;
    }
    
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
      toast.error('❌ Unable to open print window. Please check if popups are blocked.');
      return;
    }
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Show print status
    const loadingToast = toast.loading('🖨 Preparing to print...');
    
    // Automatically trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        toast.dismiss(loadingToast);
        printWindow.print();
        toast.success('🖨 Print dialog opened! Check your printer.');
      }, 500);
    };
    
    printWindow.focus();
    
    // Dismiss loading toast after timeout as fallback
    setTimeout(() => {
      toast.dismiss(loadingToast);
    }, 3000);
  };

  // Generate receipt HTML
// Generate receipt HTML
// Complete generateReceiptHTML function - Copy this ENTIRE function into your React component

const generateReceiptHTML = (bill, autoPrint = false) => {
  if (!bill) {
    console.error('No bill data provided to generateReceiptHTML');
    return '';
  }
  
  const fmt = (val) => `₹${parseFloat(val || 0).toFixed(2)}`;
  
  // Calculate GST for individual items based on price threshold
  const calculateItemGST = (price, quantity) => {
    if (price > 2500) {
      // 12% GST for items above 2500
      const gstRate = 0.12;
      const baseAmount = (price * quantity) / (1 + gstRate);
      const totalGST = (price * quantity) - baseAmount;
      const cgst = totalGST / 2;
      const sgst = totalGST / 2;
      
      return {
        gstRate: 12,
        baseAmount: parseFloat(baseAmount.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        totalGST: parseFloat(totalGST.toFixed(2))
      };
    } else {
      // 5% GST for items 2500 and below
      const gstRate = 0.05;
      const baseAmount = (price * quantity) / (1 + gstRate);
      const totalGST = (price * quantity) - baseAmount;
      const cgst = totalGST / 2;
      const sgst = totalGST / 2;
      
      return {
        gstRate: 5,
        baseAmount: parseFloat(baseAmount.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        totalGST: parseFloat(totalGST.toFixed(2))
      };
    }
  };
  
  // Calculate overall GST breakdown for all items
  const calculateOverallGST = (items) => {
    let taxable12 = 0;
    let cgst12 = 0;
    let sgst12 = 0;
    
    let taxable5 = 0;
    let cgst5 = 0;
    let sgst5 = 0;
    
    items.forEach(item => {
      // CRITICAL FIX: Use price field which contains adjusted price for combos
      const price = item.price || item.pricing?.offerPrice || 0;
      const gst = calculateItemGST(price, item.quantity || 1);
      
      if (gst.gstRate === 12) {
        taxable12 += gst.baseAmount;
        cgst12 += gst.cgst;
        sgst12 += gst.sgst;
      } else {
        taxable5 += gst.baseAmount;
        cgst5 += gst.cgst;
        sgst5 += gst.sgst;
      }
    });
    
    return {
      gst12: {
        taxable: parseFloat(taxable12.toFixed(2)),
        cgst: parseFloat(cgst12.toFixed(2)),
        sgst: parseFloat(sgst12.toFixed(2)),
        total: parseFloat((cgst12 + sgst12).toFixed(2))
      },
      gst5: {
        taxable: parseFloat(taxable5.toFixed(2)),
        cgst: parseFloat(cgst5.toFixed(2)),
        sgst: parseFloat(sgst5.toFixed(2)),
        total: parseFloat((cgst5 + sgst5).toFixed(2))
      }
    };
  };
  
  // Calculate actual discount: Total MRP - Total Offer Price (using price field for combo items)
  const calculateActualDiscount = (items) => {
    let totalMRP = 0;
    let totalOffer = 0;
    
    items.forEach(item => {
      const mrp = item.pricing?.mrp || item.originalPrice || 0;
      // CRITICAL FIX: Use price field which contains adjusted price for combos
      const offerPrice = item.price || item.pricing?.offerPrice || 0;
      const qty = item.quantity || 1;
      
      totalMRP += mrp * qty;
      totalOffer += offerPrice * qty;
    });
    
    return parseFloat((totalMRP - totalOffer).toFixed(2));
  };
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${bill.billNumber}</title>
        <style>
          @page {
            width: 81mm;
            height: auto;
            margin: 2mm;
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11.5px; 
            font-weight: bold;
            line-height: 1.2;
            margin: 0;
            padding: 3mm 5mm;
            width: 68mm;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 18px; font-weight: bold; }
          .medium { font-size: 15px; }
          .small { font-size: 12px; }
          .divider { 
            border-top: 1px dashed #000; 
            margin: 2mm 0; 
            width: 100%;
          }
          .solid-divider {
            border-top: 1px solid #000; 
            margin: 1.5mm 0; 
            width: 100%;
          }
          .flex-between { 
            display: flex; 
            justify-content: space-between;
            width: 100%;
            margin: 0.5mm 0;
          }
          .table-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 9.5px;
            padding: 1.5mm 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            margin: 1.5mm 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding: 0.5mm 0;
            line-height: 1.2;
          }
          @media print {
            body { 
              margin: 0;
              padding: 3mm 5mm;
              width: 68mm;
            }
            .no-print { display: none; }
            * { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="bold large">VEEDRA THE BRAND</div>
          <div class="small">Wholesalers in Western Wear,</div>
          <div class="small">Ethnic Wear & Indo-Western Wear</div>
          <div class="small">1st Parallel Road, Durgigudi,</div>
          <div class="small">Shimoga – 577201</div>
          <div class="small">Mobile: 70262 09627</div>
          <div class="small">GSTIN: __________</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="center bold medium">INVOICE</div>
        
        <div style="font-size: 12px; margin-top: 2mm;">
          <div class="flex-between">
            <span class="bold">Invoice:</span>
            <span class="bold">${bill.billNumber}</span>
          </div>
          <div class="flex-between">
            <span class="bold">Date:</span>
            <span>${new Date(bill.date).toLocaleDateString()}</span>
          </div>
          <div class="flex-between">
            <span class="bold">Time:</span>
            <span class="bold">${new Date(bill.date).toLocaleTimeString()}</span>
          </div>
        </div>
        
        ${(bill.customer && (bill.customer.name || bill.customer.phone)) ? `
        <div style="margin-top: 2mm; font-size: 12px;">
          <div class="flex-between">
            <span class="bold">Customer:</span>
            <span class="bold">${bill.customer.name || 'N/A'}</span>
          </div>
          <div class="flex-between">
            <span class="bold">Mobile:</span>
            <span>${bill.customer.phone || 'N/A'}</span>
          </div>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        ${bill.combos && bill.combos.length > 0 ? `
        <div style="font-size: 11px; margin-bottom: 2mm;">
          <div class="bold">COMBO OFFERS APPLIED:</div>
          ${(bill.combos || []).map(combo => `
            <div style="margin: 1.5mm 0; padding: 1.5mm; border: 1px dashed #666;">
              <div class="bold">${combo.name}</div>
              <div style="font-size: 10px;">Total: ₹${combo.offerPrice}</div>
            </div>
          `).join('')}
        </div>
        <div class="divider"></div>
        ` : ''}
        
        <div class="table-header">
          <span style="width: 20mm;">NAME</span>
          <span style="width: 9mm;">MRP</span>
          <span style="width: 6mm;">QTY</span>
          <span style="width: 9mm;">OFFER</span>
          <span style="width: 11mm;">AMT</span>
        </div>
        
        ${bill.singlesItems && bill.singlesItems.length > 0 ? 
          (bill.singlesItems || []).map((item, index) => {
            const mrp = item.pricing?.mrp || item.originalPrice || 0;
            const offerPrice = item.price || item.pricing?.offerPrice || 0;
            return `
          <div class="item-row">
            <span style="width: 20mm; word-wrap: break-word; line-height: 1.2;">
              ${item.name}
            </span>
            <span style="width: 9mm;">${fmt(mrp)}</span>
            <span style="width: 6mm; text-align: right;">${item.quantity}</span>
            <span style="width: 9mm; font-weight: bold;">${fmt(offerPrice)}</span>
            <span style="width: 11mm; font-weight: bold;">${fmt(offerPrice * item.quantity)}</span>
          </div>
        `;}).join('') : ''}

        ${bill.comboItems && bill.comboItems.length > 0 ? 
          (bill.comboItems || []).map((item, index) => {
            // CRITICAL FIX: Use price field which contains the adjusted price
            const adjustedPrice = item.price || item.comboPrice || item.adjustedPrice || 0;
            const originalMRP = item.pricing?.mrp || item.originalPrice || 0;
            
            return `
          <div class="item-row">
            <span style="width: 20mm; word-wrap: break-word; line-height: 1.2;">
              ${item.name}
            </span>
            <span style="width: 9mm;">${fmt(originalMRP)}</span>
            <span style="width: 6mm; text-align: right;">${item.quantity}</span>
            <span style="width: 9mm; font-weight: bold;">${fmt(adjustedPrice)}</span>
            <span style="width: 11mm; font-weight: bold;">${fmt(adjustedPrice * item.quantity)}</span>
          </div>
        `;}).join('') : ''}
        
        <div class="solid-divider"></div>
        
        <div style="font-size: 12px; margin-top: 2mm;">
          ${(() => {
            const allItems = [
              ...(bill.singlesItems || []),
              ...(bill.comboItems || [])
            ];
            const totalItems = allItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const gstBreakdown = calculateOverallGST(allItems);
            
            // Calculate actual discount
            const actualDiscount = calculateActualDiscount(allItems);
            
            // Calculate total MRP
            const totalMRP = allItems.reduce((sum, item) => {
              const mrp = item.pricing?.mrp || item.originalPrice || 0;
              const qty = item.quantity || 1;
              return sum + (mrp * qty);
            }, 0);
            
            return `
              <div class="flex-between">
                <span>Total Items:</span>
                <span class="bold">${allItems.length}</span>
              </div>
              <div class="flex-between">
                <span>Item Qty:</span>
                <span class="bold">${totalItems}</span>
              </div>
              <div class="solid-divider" style="margin: 2mm 0;"></div>
              <div class="flex-between">
                <span class="bold">Total MRP:</span>
                <span class="bold">${fmt(totalMRP)}</span>
              </div>
              <div class="flex-between" style="color: #28a745;">
                <span>Discount:</span>
                <span class="bold">- ${fmt(actualDiscount)}</span>
              </div>
              <div class="solid-divider"></div>
              <div class="flex-between bold" style="font-size: 15px;">
                <span>Net Payable:</span>
                <span>${fmt(bill.total)}</span>
              </div>
              <div class="divider"></div>
              <div class="flex-between">
                <span class="bold">Given Amount:</span>
                <span class="bold">${fmt(bill.receivedAmount)}</span>
              </div>
              <div class="flex-between">
                <span>Return Amount:</span>
                <span class="bold">${fmt(bill.change)}</span>
              </div>
              <div class="divider"></div>
              <div class="center bold small">TAX SUMMARY</div>
              <div style="font-size: 10px; margin-top: 1.5mm;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 1mm;">
                  <span style="width: 12mm;">Tax %</span>
                  <span style="width: 14mm;">Taxable</span>
                  <span style="width: 10mm;">SGST</span>
                  <span style="width: 10mm;">CGST</span>
                  <span style="width: 12mm;">GST</span>
                </div>
                <div class="solid-divider" style="margin: 1mm 0;"></div>
                ${gstBreakdown.gst12.total > 0 ? `
                  <div style="display: flex; justify-content: space-between;">
                    <span style="width: 12mm; font-weight: bold;">12%</span>
                    <span style="width: 14mm;">${fmt(gstBreakdown.gst12.taxable)}</span>
                    <span style="width: 10mm; font-weight: bold;">${fmt(gstBreakdown.gst12.sgst)}</span>
                    <span style="width: 10mm;">${fmt(gstBreakdown.gst12.cgst)}</span>
                    <span style="width: 12mm; font-weight: bold;">${fmt(gstBreakdown.gst12.total)}</span>
                  </div>
                ` : ''}
                ${gstBreakdown.gst5.total > 0 ? `
                  <div style="display: flex; justify-content: space-between; ${gstBreakdown.gst12.total > 0 ? 'margin-top: 1mm;' : ''}">
                    <span style="width: 12mm; font-weight: bold;">5%</span>
                    <span style="width: 14mm;">${fmt(gstBreakdown.gst5.taxable)}</span>
                    <span style="width: 10mm; font-weight: bold;">${fmt(gstBreakdown.gst5.sgst)}</span>
                    <span style="width: 10mm;">${fmt(gstBreakdown.gst5.cgst)}</span>
                    <span style="width: 12mm; font-weight: bold;">${fmt(gstBreakdown.gst5.total)}</span>
                  </div>
                ` : ''}
              </div>
            `;
          })()}
        </div>
        
        <div class="divider"></div>
        
        <div style="font-size: 12px;">
          <div class="flex-between">
            <span class="bold">Payment:</span>
            <span>${(bill.paymentMethod || 'cash').toUpperCase()}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="center">
          <div class="bold small">Terms & Conditions</div>
          <div style="font-size: 11px; margin-top: 1.5mm;">
            <div>No Exchange, No Return, No Guarantee.</div>
            <div>Please verify items before leaving.</div>
            <div>Working Hours: 8:00 AM – 9:00 PM</div>
            <div style="margin-top: 1mm; font-style: italic;">*GST: 5% (≤₹2500) | 12% (>₹2500)</div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="center">
          <div class="bold medium">Thank You for Shopping at</div>
          <div class="bold medium">VEEDRA THE BRAND</div>
          <div class="small">Best Prices in Shimoga</div>
          <div class="small">Wholesale & Retail Available!</div>
        </div>
        
        ${autoPrint ? `
        <div class="no-print center" style="margin-top: 20px;">
          <div style="color: #28a745; font-weight: bold; margin-bottom: 10px;">
            📄 Printing... Please check your printer
          </div>
          <button onclick="window.print();" 
                  style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
            🖨 Print Again
          </button>
          <button onclick="window.close();" 
                  style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px; font-weight: bold;">
            ✕ Close
          </button>
        </div>
        ` : `
        <div class="no-print center" style="margin-top: 20px;">
          <button onclick="window.print(); window.close();" 
                  style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
            🖨 Print Receipt
          </button>
          <button onclick="window.close();" 
                  style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px; font-weight: bold;">
            ✕ Close
          </button>
        </div>
        `}
      </body>
    </html>
  `;
};
  // Print receipt - matches reference formatting (legacy function for preview)
  const printReceipt = () => {
    if (!lastBill) return;
    printReceiptWithData(lastBill);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7fafc', fontFamily: '"Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* Add camera scanning styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          #scanner_ref canvas {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
          }
          #scanner_ref video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
          }
          .drawingBuffer {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
        `
      }} />

      {/* Main Container - Modern layout */}
      <div className="flex gap-6 p-6 max-w-7xl mx-auto">
        {/* Left Panel - Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100" style={{ flex: '0 0 400px' }}>
          {/* Customer Section */}
          <div className="mb-4 bg-gray-50 rounded-lg p-3">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <span className="bg-teal-100 text-teal-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">👤</span>
              Customer
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  maxLength="10"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Customer name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Combo Selection Section */}
          <div className="mb-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">🎁</span>
              Combo Offers
            </h3>
            <div className="space-y-3">
              <select 
                className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const combo = combos.find(c => c._id === e.target.value);
                    if (combo) addComboToBill(combo);
                    e.target.value = "";
                  }
                }}
              >
                <option value="">-- Select a combo --</option>
                {combos.filter(combo => {
                  const status = computeStatus({
                    validFrom: combo.validFrom,
                    validTo: combo.validTo,
                    paused: combo.paused
                  });
                  return status === 'active' && !selectedCombos.find(c => c._id === combo._id);
                }).map(combo => (
                  <option key={combo._id} value={combo._id}>
                    {combo.name} — {combo.sku} — {fmt(combo.offerPrice)}
                  </option>
                ))}
              </select>
            </div>

            {/* Instructions when combos are active */}
            {selectedCombos.length > 0 && selectedCombos.some(combo => !combo.slots?.every(slot => slot.assigned)) && (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <span className="text-blue-600 mr-2">💡</span>
                  <span className="font-medium text-blue-800 text-sm">Auto-Assignment Active</span>
                </div>
                <p className="text-xs text-blue-700">
                  Scan or search for products to automatically fill combo slots. Products will be assigned to the most recent combo first.
                </p>
              </div>
            )}

            {/* Selected Combos Display */}
            <div className="mt-3 space-y-3">
              {selectedCombos.map((combo, index) => {
                const allSlotsFilled = combo.slots?.every(slot => slot.assigned) || false;
                const assignedCount = combo.slots?.filter(slot => slot.assigned).length || 0;
                const totalSlots = combo.slots?.length || 0;
                const progressPercent = totalSlots > 0 ? (assignedCount / totalSlots) * 100 : 0;
                
                return (
                  <div key={index} className={`rounded-lg p-3 mb-3 border-2 transition-all duration-200 ${
                    allSlotsFilled 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                      : assignedCount > 0 
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-800 flex items-center">
                          <span className="mr-2">{allSlotsFilled ? '✅' : assignedCount > 0 ? '🔄' : '⏳'}</span>
                          {combo.name}
                        </div>
                        <div className="text-xs text-gray-600">SKU: {combo.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-700">{fmt(combo.offerPrice)}</div>
                        <div className={`text-xs font-bold ${allSlotsFilled ? 'text-green-700' : assignedCount > 0 ? 'text-yellow-700' : 'text-blue-700'}`}>
                          {allSlotsFilled ? '🎉 Complete!' : `${assignedCount}/${totalSlots} items`}
                        </div>
                        <button 
                          onClick={() => removeComboInstance(combo)}
                          className="mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            allSlotsFilled ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Slots display */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                      {combo.slots?.map((slot, slotIndex) => {
                        const priceRange = (slot.minPrice || slot.maxPrice) ? 
                          `₹${fmt(slot.minPrice)}-${fmt(slot.maxPrice)}` : "Any Price";
                        
                        return (
                          <div 
                            key={slotIndex} 
                            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                              slot.assigned 
                                ? 'bg-green-100 border-green-400 shadow-sm' 
                                : 'bg-white border-dashed border-blue-300 hover:border-blue-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-gray-700">Slot {slotIndex + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                slot.assigned ? 'bg-green-200 text-green-800' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {slot.assigned ? '✓' : '○'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mb-1">{priceRange}</div>
                            {slot.assigned ? (
                              <div className="text-xs">
                                <div className="font-medium text-green-800">{slot.assigned.product.name}</div>
                                <div className="text-green-600">
                                  <div className="line-through text-gray-400">{fmt(slot.assigned.product.pricing?.discountedPrice || slot.assigned.product.pricing?.offerPrice || 0)}</div>
                                  <div className="font-bold text-green-700">{fmt(calculateAdjustedPrice(combo, slot))}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic">Scan product to fill</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Scanner Section */}
          <div className="mb-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">📱</span>
              Scan Product
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeInput}
                  className="flex-1 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  placeholder="Enter or scan barcode / SKU"
                  autoFocus
                />
                <input
                  type="number"
                  min="1"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                />
                <button 
                  onClick={() => {
                    if (barcodeInput.trim()) {
                      handleBarcodeInput({ key: 'Enter', preventDefault: () => {} });
                    }
                  }}
                  className="px-4 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
              
              <div className="flex gap-3 items-center bg-white p-2 rounded-lg border border-gray-200">
                <div 
                  ref={scannerRef}
                  id="scanner_ref"
                  className="rounded-lg overflow-hidden relative bg-gray-900 flex items-center justify-center text-white text-xs shadow-inner" 
                  style={{ width: '120px', height: '90px' }}
                >
                  {!isScanning && (
                    <div className="text-center z-20 relative">
                      <div className="text-lg mb-1">📷</div>
                      <small>Camera</small>
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 text-white text-xs z-10 pointer-events-none">
                      <div className="text-center">
                        <div className="animate-pulse text-green-400 text-lg">🔍</div>
                        <small className="text-green-400">Scanning...</small>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  {!isScanning ? (
                    <>
                      <button 
                        onClick={startCameraScanning}
                        disabled={!!cameraError}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        📷 Start Camera
                      </button>
                      {cameraError && cameraError.includes('denied') && (
                        <button 
                          onClick={requestCameraPermission}
                          className="w-full px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                        >
                          🔐 Grant Access
                        </button>
                      )}
                    </>
                  ) : (
                    <button 
                      onClick={stopCameraScanning}
                      className="w-full px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 font-medium"
                    >
                      ⏹ Stop Camera
                    </button>
                  )}
                  {cameraError && (
                    <div className="text-xs text-red-600">{cameraError}</div>
                  )}
                  {isScanning && (
                    <div className="text-xs text-green-600 font-medium">
                      📷 Camera Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Single Products Section */}
          <div className="mb-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">🛍</span>
              Single Products
            </h3>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg text-sm shadow-sm">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <small className="text-gray-500">({item.productCode || item.code})</small>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{fmt(item.price)} × {item.quantity}</span>
                    <button 
                      onClick={() => removeFromCart(item._id)}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-gray-500 text-sm text-center py-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  No single products added
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={clearBill}
              className="w-full px-4 py-3 text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium shadow-md"
            >
              🗑 Clear Bill
            </button>
          </div>
        </div>

        {/* Right Panel - Bill Summary */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-xl">Bill Summary</h3>
            <div className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
              {(cart.length + selectedCombos.length)} items
            </div>
          </div>
          
          <div>
            {/* Combos Summary */}
            <div className="mb-3">
              <h4 className="font-medium text-gray-700 mb-2">Combos</h4>
              {selectedCombos.length > 0 ? (
                <div className="space-y-2">
                  {selectedCombos.map((combo, index) => {
                    const allSlotsFilled = combo.slots?.every(slot => slot.assigned) || false;
                    const assignedCount = combo.slots?.filter(slot => slot.assigned).length || 0;
                    const saving = allSlotsFilled ? (() => {
                      const sumMRP = combo.slots.reduce((sum, slot) => {
                        return slot.assigned ? sum + Number(slot.assigned.product.pricing?.discountedPrice || slot.assigned.product.pricing?.offerPrice || 0) : sum;
                      }, 0);
                      return Math.max(0, sumMRP - Number(combo.offerPrice || 0));
                    })() : 0;
                    
                    return (
                      <div key={`${combo._id}-${index}`} className="text-sm p-2 border-b border-dashed border-gray-300 mb-2">
                        <div className="flex justify-between items-center">
                          <strong>{combo.name}</strong>
                          <span>{fmt(combo.offerPrice)}</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Slots: {assignedCount}/{combo.slots?.length || 0} {allSlotsFilled && <span className="text-green-700">(Ready)</span>}
                        </div>
                        {saving > 0 && (
                          <div className="text-xs text-green-700 mt-1">
                            Saving: {fmt(saving)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No combos added</div>
              )}
            </div>

            {/* Singles Table */}
            <h4 className="font-medium text-gray-700 mb-2">Singles</h4>
            <table className="w-full border-collapse border border-gray-300 text-sm mb-3">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-1 text-left text-xs">Item</th>
                  <th className="border border-gray-300 p-1 text-left text-xs">MRP</th>
                  <th className="border border-gray-300 p-1 text-left text-xs">Qty</th>
                  <th className="border border-gray-300 p-1 text-right text-xs">Total</th>
                  <th className="border border-gray-300 p-1"></th>
                </tr>
              </thead>
              <tbody>
                {cart.filter(item => getSinglesQuantity(item) > 0).map((item, index) => {
                  const singlesQty = getSinglesQuantity(item);
                  const singlePrice = item.pricing?.offerPrice || item.price || 0;
                  return (
                    <tr key={index}>
                      <td className="border border-gray-300 p-1">
                        <div className="text-xs">{item.name}</div>
                        <div className="text-xs text-gray-500">Code: {item.productCode || 'N/A'}</div>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <div className="text-xs text-gray-500 line-through">{fmt(item.pricing?.mrp || singlePrice)}</div>
                        <div className="text-xs font-bold text-green-700">{fmt(singlePrice)}</div>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs"
                          >
                            <Minus className="h-2 w-2" />
                          </button>
                          <span className="w-6 text-center text-xs">{singlesQty}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs"
                          >
                            <Plus className="h-2 w-2" />
                          </button>
                        </div>
                      </td>
                      <td className="border border-gray-300 p-1 text-right">
                        <div className="text-xs text-gray-500">Unit: {fmt(item.price)}</div>
                        <div className="text-xs font-bold">{fmt(item.price * singlesQty)}</div>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <button 
                          onClick={() => removeFromCart(item._id)}
                          className="px-2 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {cart.filter(item => getSinglesQuantity(item) > 0).length === 0 && (
                  <tr>
                    <td colSpan="5" className="border border-gray-300 p-4 text-center text-gray-500 text-xs">
                      {cart.length === 0 ? "No items in cart" : "All items are assigned to combos"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Combo Items Table */}
            {(() => {
              const comboItems = [];
              selectedCombos.forEach(combo => {
                const allSlotsFilled = combo.slots?.every(slot => slot.assigned) || false;
                if (allSlotsFilled) {
                  combo.slots.forEach(slot => {
                    if (slot.assigned) {
                      const adjustedPrice = calculateAdjustedPrice(combo, slot);
                      const originalPrice = Number(slot.assigned.product.pricing?.offerPrice || 0);
                      comboItems.push({
                        ...slot.assigned.product,
                        quantity: slot.assigned.qty,
                        adjustedPrice: adjustedPrice,
                        originalPrice: originalPrice,
                        comboName: combo.name
                      });
                    }
                  });
                }
              });

              if (comboItems.length > 0) {
                return (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Combo Items (Adjusted Pricing)</h4>
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="border border-gray-300 p-1 text-left text-xs">Item</th>
                          <th className="border border-gray-300 p-1 text-left text-xs">Original</th>
                          <th className="border border-gray-300 p-1 text-left text-xs">Adjusted</th>
                          <th className="border border-gray-300 p-1 text-left text-xs">Qty</th>
                          <th className="border border-gray-300 p-1 text-right text-xs">Total</th>
                          <th className="border border-gray-300 p-1 text-xs">Combo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comboItems.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-1 text-xs">{item.name}</td>
                            <td className="border border-gray-300 p-1 text-xs text-gray-500">{fmt(item.pricing?.discountedPrice || item.pricing?.offerPrice || 0)}</td>
                            <td className="border border-gray-300 p-1 text-xs font-bold text-orange-700">{fmt(item.adjustedPrice)}</td>
                            <td className="border border-gray-300 p-1 text-xs text-center">{item.quantity}</td>
                            <td className="border border-gray-300 p-1 text-right text-xs font-bold">
                              {fmt(item.adjustedPrice * item.quantity)}
                            </td>
                            <td className="border border-gray-300 p-1 text-xs text-blue-600">
                              {item.comboName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return null;
            })()}

            {/* Totals Section */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 mb-4 border border-blue-100">
              <div className="space-y-2">
                {(() => {
                  const consumedItems = checkSinglesAvailability();
                  if (consumedItems.length > 0) {
                    return (
                      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mb-2">
                        ℹ️ All quantities of {consumedItems.join(', ')} are used in combos. Increase quantities if you want singles pricing.
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Singles Subtotal:</span>
                  <span className="font-medium">{fmt(calculateSinglesSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Combos Total:</span>
                  <span className="font-medium">{fmt(calculateCombosSubtotal())}</span>
                </div>
                
                {/* GST Breakdown */}
                {(() => {
                  const grandTotal = calculateGrandTotal();
                  if (grandTotal > 0) {
                    const allItems = [
                      ...cart.map(item => ({ price: item.price, quantity: item.quantity })),
                      ...selectedCombos.flatMap(combo => 
                        (combo.items || []).map(item => ({ price: item.offerPrice || item.price, quantity: item.quantity }))
                      )
                    ];
                    const gstBreakdown = calculateGSTBreakdown(grandTotal, allItems);
                    
                    return (
                      <div className="border-t border-gray-200 pt-2 mt-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Taxable Amount:</span>
                          <span className="font-medium">{fmt(gstBreakdown.baseAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">SGST ({gstBreakdown.sgstRate}%):</span>
                          <span className="font-medium">{fmt(gstBreakdown.sgst)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">CGST ({gstBreakdown.cgstRate}%):</span>
                          <span className="font-medium">{fmt(gstBreakdown.cgst)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <div className="border-t border-blue-200 pt-2 mt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-800">GRAND TOTAL:</span>
                    <span className="text-blue-700">{fmt(calculateGrandTotal())}</span>
                  </div>
                </div>
                {calculateTotalSavings() > 0 && (
                  <div className="flex justify-between text-sm bg-green-100 rounded-md p-2 mt-2">
                    <span className="text-green-700 font-medium flex items-center">
                      💰 You Saved:
                    </span>
                    <span className="text-green-800 font-bold">{fmt(calculateTotalSavings())}</span>
                  </div>
                )}
              </div>
            </div>

            <hr className="my-3" />

            {/* Payment Section */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">💳</span>
                Payment Methods
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                      💵 Cash Amount
                    </div>
                    <input 
                      type="number" 
                      min="0" 
                      value={paymentAmounts.cash || ''} 
                      onChange={(e) => setPaymentAmounts(prev => ({ ...prev, cash: Number(e.target.value) || 0 }))}
                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      placeholder="0.00"
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                      📱 UPI Amount
                    </div>
                    <input 
                      type="number" 
                      min="0" 
                      value={paymentAmounts.upi || ''} 
                      onChange={(e) => setPaymentAmounts(prev => ({ ...prev, upi: Number(e.target.value) || 0 }))}
                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      placeholder="0.00"
                    />
                  </label>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Total Paid:</span>
                    <span className="text-lg font-bold text-blue-700">₹{((paymentAmounts.cash || 0) + (paymentAmounts.upi || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      {((paymentAmounts.cash || 0) + (paymentAmounts.upi || 0)) >= calculateGrandTotal() ? 'Change:' : 'Due:'}
                    </span>
                    <span className={`text-lg font-bold ${((paymentAmounts.cash || 0) + (paymentAmounts.upi || 0)) >= calculateGrandTotal() ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.abs(((paymentAmounts.cash || 0) + (paymentAmounts.upi || 0)) - calculateGrandTotal()).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={finalizeAndPrint}
                    disabled={processing || (cart.length === 0 && selectedCombos.length === 0)}
                    className="flex-1 px-4 py-3 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md"
                  >
                    {processing ? '⏳ Processing...' : '✅ Finalize & Print'}
                  </button>
                  <button 
                    onClick={() => {
                      // Create preview bill with combo items
                      const previewItems = [];
                      
                      // Get set of cart item IDs that are assigned to combos
                      const assignedCartItemIds = new Set();
                      selectedCombos.forEach(combo => {
                        if (combo.slots) {
                          combo.slots.forEach(slot => {
                            if (slot.assigned && slot.assigned.cartItemId) {
                              assignedCartItemIds.add(slot.assigned.cartItemId);
                            }
                          });
                        }
                      });
                      
                      // Add single products (considering cart item assignments)
                      cart.forEach(item => {
                        // If this cart item is assigned to a combo, reduce quantity by 1
                        const quantityForSingles = assignedCartItemIds.has(item.cartItemId) 
                          ? Math.max(0, item.quantity - 1)  // Reduce by 1 for combo assignment
                          : item.quantity; 
                        
                        if (quantityForSingles > 0) {
                          previewItems.push({
                            ...item,
                            quantity: quantityForSingles,
                            price: item.pricing?.offerPrice || item.price || 0, // Force singles to use offer price
                            originalPrice: item.pricing?.mrp || item.price || 0,
                            isComboApplied: false
                          });
                        }
                      });
                      
                      // Add combo products
                      selectedCombos.forEach(combo => {
                        const allSlotsFilled = combo.slots?.every(slot => slot.assigned) || false;
                        if (allSlotsFilled) {
                          combo.slots.forEach(slot => {
                            if (slot.assigned) {
                              // Use the calculateAdjustedPrice function for consistency
                              const adjustedPrice = calculateAdjustedPrice(combo, slot);
                              const originalPrice = Number(slot.assigned.product.pricing?.discountedPrice || slot.assigned.product.pricing?.offerPrice || 0);
                              
                              previewItems.push({
                                ...slot.assigned.product,
                                quantity: slot.assigned.qty,
                                price: adjustedPrice,
                                originalPrice: originalPrice,
                                isComboApplied: true,
                                appliedComboName: combo.name,
                                comboPrice: adjustedPrice
                              });
                            }
                          });
                        }
                      });

                      // Separate items for preview
                      const previewSingles = previewItems.filter(item => !item.isComboApplied);
                      const previewCombos = previewItems.filter(item => item.isComboApplied);

                      const previewBill = {
                        billNumber: 'PREVIEW',
                        date: new Date(),
                        customer: customerInfo,
                        items: previewItems,
                        singlesItems: previewSingles,
                        comboItems: previewCombos,
                        subtotal: calculateSinglesSubtotal(),
                        combosTotal: calculateCombosSubtotal(),
                        tax: 0,
                        discount: calculateTotalSavings(),
                        total: calculateGrandTotal(),
                        paymentMethod: (paymentAmounts.cash > 0 && paymentAmounts.upi > 0) ? 'mix' : 
                                     paymentAmounts.cash > 0 ? 'cash' : 'upi',
                        receivedAmount: (paymentAmounts.cash || 0) + (paymentAmounts.upi || 0),
                        change: Math.max(0, ((paymentAmounts.cash || 0) + (paymentAmounts.upi || 0)) - calculateGrandTotal()),
                        combos: selectedCombos.filter(combo => combo.slots?.every(slot => slot.assigned))
                      };
                      
                      printReceiptWithData(previewBill);
                    }}
                    className="px-4 py-3 text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium"
                  >
                    👁 Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Product Search - Fixed Position */}
      {searchTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">🔍</span>
                Search Results ({filteredProducts.length} found)
              </h4>
              <button 
                onClick={() => setSearchTerm('')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.slice(0, 20).map(product => (
                <button
                  key={product._id}
                  onClick={() => {
                    assignScannedProduct(product, 1);
                    setSearchTerm('');

                  }}
                  className="p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="font-medium text-sm text-gray-900 truncate">{product.name}</div>
                  <div className="text-xs text-gray-600 flex justify-between mt-1">
                    <span>{product.productCode}</span>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 line-through">
                        {fmt(product.pricing?.mrp || 0)}
                      </div>
                      <div className="font-semibold text-green-600">
                        {fmt(product.pricing?.offerPrice || 0)}
                      </div>
                      {product.pricing?.discountedPrice && product.pricing?.discountedPrice !== product.pricing?.offerPrice && (
                        <div className="text-xs text-orange-600">
                          (In Combo: {fmt(product.pricing?.discountedPrice)})
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span>Stock: {product.inventory?.currentStock || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Input (floating) */}
      <div className="fixed top-20 right-4 w-80 z-40">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Quick search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default POSBillingPage;

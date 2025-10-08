import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Plus, 
  Search, 
  Trash2, 
  Calculator,
  ShoppingCart,
  User,
  Gift,
  Percent,
  Receipt,
  AlertTriangle,
  ScanLine,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import comboService from '../../services/comboService';
import billingService from '../../services/billingService';
import Quagga from 'quagga';

const BillingPage = () => {
  console.log('BillingPage rendering...');
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  console.log('BillingPage user:', user);
  
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [availableCombos, setAvailableCombos] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningMode, setScanningMode] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  
  // Refs for barcode scanning
  const barcodeInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const videoRef = useRef(null);
  const scannerContainerRef = useRef(null);

  // Load products and combos from API
  useEffect(() => {
    loadData();
  }, []);

  // Simple test return
  if (!user) {
    return <div>Loading user...</div>;
  }

  const loadData = async () => {
    try {
      console.log('Loading billing page data...');
      const [productsData, combosData] = await Promise.all([
        productService.getProducts(),
        comboService.getCombos()
      ]);
      
      console.log('Products response:', productsData);
      console.log('Combos response:', combosData);
      
      setProducts(productsData.data || productsData || []);
      setAvailableCombos(combosData.data || combosData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      console.log('Failed to load products and combos');
    }
  };

  // Barcode scanning functionality

  // Barcode scanning functionality
  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      // If scanning mode is enabled, capture all key presses
      if (scanningMode && e.target !== barcodeInputRef.current) {
        e.preventDefault();
        
        // Focus the barcode input if not already focused
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          // Add the pressed key to the input
          setBarcodeInput(prev => prev + e.key);
        }
      }
    };

    if (scanningMode) {
      document.addEventListener('keypress', handleGlobalKeyPress);
      
      // Auto-focus the barcode input when scanning mode is enabled
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keypress', handleGlobalKeyPress);
    };
  }, [scanningMode]);

  // Auto-scan when barcode is complete (typically 10-13 characters)
  useEffect(() => {
    if (barcodeInput.length >= 10) {
      // Clear any existing timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      
      // Set a small delay to ensure complete barcode is captured
      scanTimeoutRef.current = setTimeout(() => {
        handleBarcodeScanned(barcodeInput);
      }, 100);
    }
    
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [barcodeInput]);

  const handleBarcodeScanned = async (barcode, source = 'manual') => {
    setIsScanning(true);
    
    // Add to scan history
    setScanHistory(prev => [
      { barcode, timestamp: new Date(), source },
      ...prev.slice(0, 9) // Keep last 10 scans
    ]);
    
    try {
      // Try API first, fallback to local search
      let product = null;
      
      try {
        const response = await productService.scanProductByBarcode(barcode.trim());
        product = response.data;
      } catch (apiError) {
        // Fallback to local search if API fails
        console.warn('API scan failed, using local search:', apiError);
        product = products.find(p => p.barcode === barcode.trim());
      }
      
      if (product) {
        // Add product to cart with scanned flag
        addToCart(product, true);
        
        // Visual feedback
        setIsScanning(false);
        
        // Play success sound (optional)
        playSuccessSound();
        
        console.log(`🔍 ${product.name} scanned via ${source}!`);
        
      } else {
        console.log(`❌ Product not found for barcode: ${barcode}`);
        setIsScanning(false);
      }
      
    } catch (error) {
      console.error('Barcode scan error:', error);
      console.log('Error processing barcode scan');
      setIsScanning(false);
    }
    
    // Clear barcode input for next scan
    setBarcodeInput('');
    
    // Keep focus on barcode input if scanning mode is still active
    if (scanningMode && barcodeInputRef.current) {
      setTimeout(() => {
        barcodeInputRef.current.focus();
      }, 100);
    }
  };

  const playSuccessSound = () => {
    // Create a short beep sound for successful scan
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const toggleScanningMode = () => {
    setScanningMode(!scanningMode);
    setBarcodeInput('');
    
    if (!scanningMode) {
      console.log('🔍 Scanning mode enabled - scan or type barcodes');
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
    } else {
      toast('Scanning mode disabled');
    }
  };

  const handleManualBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleBarcodeScanned(barcodeInput.trim(), 'manual');
    }
  };

  // Camera scanning functionality with QuaggaJS
  const startCameraScanning = async () => {
    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('❌ Camera not supported in this browser. Try Chrome, Firefox, or Edge.');
      return;
    }

    try {
      setCameraScanning(true);
      
      // First, test camera access
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      // Stop test stream immediately
      testStream.getTracks().forEach(track => track.stop());
      
      console.log('🔄 Initializing camera scanner...');
      
      // Initialize QuaggaJS with comprehensive settings
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerContainerRef.current,
          constraints: {
            width: { min: 320, ideal: 640, max: 1280 },
            height: { min: 240, ideal: 480, max: 720 },
            facingMode: "environment", // Use back camera on mobile
            aspectRatio: { min: 1, max: 2 }
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 2,
        frequency: 10, // Process every 10th frame
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader", 
            "code_39_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true
      }, function(err) {
        if (err) {
          console.error('QuaggaJS init error:', err);
          let errorMessage = '❌ Camera initialization failed';
          let helpText = '';
          
          if (err.name === 'NotAllowedError') {
            errorMessage = '🚫 Camera permission denied';
            helpText = 'Click the camera icon in your browser\'s address bar to allow access';
          } else if (err.name === 'NotFoundError') {
            errorMessage = '📷 No camera found';
            helpText = 'Make sure your device has a camera connected';
          } else if (err.name === 'NotSupportedError') {
            errorMessage = '🌐 Camera not supported';
            helpText = 'Try using Chrome, Firefox, or Edge browser';
          } else if (err.name === 'NotReadableError') {
            errorMessage = '🔒 Camera in use by another app';
            helpText = 'Close other apps using the camera and try again';
          }
          
          console.log(`${errorMessage}${helpText ? `\n${helpText}` : ''}`);
          setCameraScanning(false);
          return;
        }
        
        console.log("QuaggaJS initialization finished. Ready to start");
        Quagga.start();
        // toast dismissed // Dismiss loading toast
        console.log('📹 Camera scanner ready! Point at any barcode');
      });

      // Listen for successful barcode detection
      Quagga.onDetected(function(data) {
        const barcode = data.codeResult.code;
        const format = data.codeResult.format;
        console.log(`Barcode detected via camera: ${barcode} (${format})`);
        
        // Stop scanning temporarily to prevent multiple reads
        Quagga.stop();
        
        // Add visual feedback - flash green
        if (scannerContainerRef.current) {
          scannerContainerRef.current.classList.add('barcode-detected');
          setTimeout(() => {
            if (scannerContainerRef.current) {
              scannerContainerRef.current.classList.remove('barcode-detected');
            }
          }, 500);
        }
        
        // Process the scanned barcode
        handleBarcodeScanned(barcode, `camera-${format}`);
        
        // Brief pause to prevent multiple scans, then restart
        setTimeout(() => {
          if (cameraScanning) {
            try {
              Quagga.start();
            } catch (error) {
              console.error('Error restarting scanner:', error);
            }
          }
        }, 1500);
      });

      // Listen for processing events (visual feedback)
      Quagga.onProcessed(function(result) {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
          // Clear previous drawings
          if (drawingCanvas && drawingCtx) {
            drawingCtx.clearRect(0, 0, 
              parseInt(drawingCanvas.getAttribute("width")), 
              parseInt(drawingCanvas.getAttribute("height"))
            );
            
            // Draw detection boxes
            if (result.boxes) {
              result.boxes.filter(function (box) {
                return box !== result.box;
              }).forEach(function (box) {
                Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {
                  color: "green", 
                  lineWidth: 2
                });
              });
            }

            // Draw main detection box
            if (result.box) {
              Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {
                color: "#00F", 
                lineWidth: 2
              });
            }

            // Draw barcode line
            if (result.codeResult && result.codeResult.code) {
              Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {
                color: 'red', 
                lineWidth: 3
              });
            }
          }
        }
      });
      
    } catch (error) {
      console.error('Camera access error:', error);
      
      let errorMessage = '❌ Camera access failed';
      let helpText = '';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '🚫 Camera permission denied';
        helpText = 'Please click "Allow" when prompted for camera access';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '📷 No camera detected';
        helpText = 'Make sure your device has a working camera';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = '🌐 Camera not supported';
        helpText = 'Try using a different browser (Chrome recommended)';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '🔒 Camera busy';
        helpText = 'Close other apps using the camera';
      } else {
        helpText = 'Try refreshing the page or using a different browser';
      }
      
      console.log(`${errorMessage}\n${helpText}`);
      setCameraScanning(false);
    }
  };

  const stopCameraScanning = () => {
    try {
      Quagga.stop();
      Quagga.offDetected();
      Quagga.offProcessed();
      setCameraScanning(false);
      toast('📹 Camera scanning stopped');
    } catch (error) {
      console.error('Error stopping camera:', error);
      setCameraScanning(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (cameraScanning) {
        stopCameraScanning();
      }
    };
  }, []);

  // Simulate barcode detection from camera (for demo)
  const simulateCameraScan = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    handleBarcodeScanned(randomProduct.barcode, 'camera');
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  const addToCart = (product, isScanned = false) => {
    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= (product.inventory?.currentStock || 0)) {
        console.log('Insufficient stock available');
        return;
      }
      setCart(cart.map(item =>
        item._id === product._id
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              lastScanned: isScanned ? new Date() : item.lastScanned
            }
          : item
      ));
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1,
        lastScanned: isScanned ? new Date() : null
      }]);
    }
    
    if (isScanned) {
      console.log(`🔍 ${product.name} scanned and added!`);
    } else {
      console.log(`${product.name} added to cart`);
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item._id !== productId));
      return;
    }
    
    const product = products.find(p => p._id === productId);
    if (quantity > (product.inventory?.currentStock || 0)) {
      console.log('Insufficient stock available');
      return;
    }
    
    setCart(cart.map(item =>
      item._id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
    console.log('Item removed from cart');
  };

  const applyCombo = (combo) => {
    if (!combo.isActive) {
      toast.error('This combo is not currently active');
      return;
    }
    
    const comboProductIds = combo.applicableProducts || combo.products || [];
    
    // If no specific products are required, combo applies to any cart
    if (comboProductIds.length === 0) {
      if (cart.length === 0) {
        toast.error('Add products to cart first');
        return;
      }
      setSelectedCombo(combo);
      const savings = calculateComboSavings(combo);
      toast.success(`${combo.name} applied! Savings: ₹${savings}`);
      return;
    }
    
    // Check if all required products are in cart
    const hasAllComboProducts = comboProductIds.every(productId =>
      cart.some(item => item._id === productId && item.quantity >= 1)
    );
    
    if (!hasAllComboProducts) {
      const missingProducts = comboProductIds.filter(productId =>
        !cart.some(item => item._id === productId && item.quantity >= 1)
      );
      toast.error(`Add all required combo products to cart first (${missingProducts.length} missing)`);
      return;
    }
    
    setSelectedCombo(combo);
    const savings = calculateComboSavings(combo);
    toast.success(`${combo.name} applied! Savings: ₹${savings}`);
  };

  const calculateComboSavings = (combo) => {
    if (!combo) return 0;
    
    const cartTotal = calculateSubtotal();
    if (combo.discountType === 'percentage') {
      const discount = (cartTotal * combo.discountValue) / 100;
      return combo.maxDiscount ? Math.min(discount, combo.maxDiscount) : discount;
    } else if (combo.discountType === 'fixed') {
      return combo.discountValue;
    }
    return 0;
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = item.pricing?.sellingPrice || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateComboDiscount = () => {
    if (selectedCombo) {
      return calculateComboSavings(selectedCombo);
    }
    return 0;
  };

  const removeCombo = () => {
    setSelectedCombo(null);
    toast.success('Combo removed');
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    const comboDiscount = calculateComboDiscount();
    
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    } else {
      return discount.value;
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const comboDiscount = calculateComboDiscount();
    const regularDiscount = calculateDiscount();
    return Math.max(0, subtotal - comboDiscount - regularDiscount);
  };

  const processBill = async () => {
    if (cart.length === 0) {
      console.log('Please add items to cart');
      return;
    }
    
    try {
      const billData = {
        customer,
        items: cart,
        subtotal: calculateSubtotal(),
        discount: calculateDiscount(),
        comboDiscount: calculateComboDiscount(),
        total: calculateTotal(),
        appliedCombo: selectedCombo,
        billedBy: user.name,
        timestamp: new Date()
      };
      
      // Create bill using API
      const createdBill = await billingService.createBill(billData);
      
      console.log('Bill processed successfully!');
      
      // Reset form
      setCart([]);
      setCustomer({ name: '', phone: '', email: '' });
      setDiscount({ type: 'percentage', value: 0 });
      setSelectedCombo(null);
      
      return createdBill;
    } catch (error) {
      console.error('Error processing bill:', error);
      console.log('Failed to process bill');
    }
  };

  const printBill = () => {
    // Implementation for printing bill
    console.log('Bill sent to printer');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-2">Process customer orders and generate bills</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Cashier: {user?.name}</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Barcode Scanner Section */}
      <Card className={`${scanningMode ? 'ring-2 ring-blue-500 bg-blue-50' : ''} transition-all duration-300`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <ScanLine className="h-5 w-5 mr-2" />
              Barcode Scanner
              {scanningMode && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </span>
              )}
              {cameraScanning && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  📹 Camera
                </span>
              )}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={toggleScanningMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  scanningMode
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {scanningMode ? 'Stop Keyboard' : 'Start Keyboard'}
              </button>
              <button
                onClick={cameraScanning ? stopCameraScanning : startCameraScanning}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  cameraScanning
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                {cameraScanning ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualBarcodeSubmit} className="flex space-x-3">
            <div className="flex-1 relative">
              <ScanLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder={scanningMode ? "Scan barcode here..." : "Enter barcode manually"}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  scanningMode 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
                } ${
                  isScanning ? 'animate-pulse bg-green-50' : ''
                }`}
                autoComplete="off"
              />
              {isScanning && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!barcodeInput.trim() || isScanning}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Add to Cart
            </button>
          </form>
          
          {/* Scanner Status */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {scanningMode && (
              <div className="flex items-center text-sm text-blue-600 bg-blue-50 p-2 rounded">
                <Zap className="h-4 w-4 mr-1" />
                <span>Keyboard Scanner Ready - Use any USB/Bluetooth scanner</span>
              </div>
            )}
            
            {cameraScanning && (
              <div className="flex items-center text-sm text-purple-600 bg-purple-50 p-2 rounded">
                <span>📹</span>
                <span className="ml-1">Camera Active - Point at barcode</span>
                <button
                  onClick={simulateCameraScan}
                  className="ml-2 text-xs bg-purple-200 px-2 py-1 rounded hover:bg-purple-300"
                >
                  Demo Scan
                </button>
              </div>
            )}
          </div>

          {/* Camera Scanner Container */}
          {cameraScanning && (
            <div className="mt-4">
              <div className="relative w-full max-w-md mx-auto">
                <div 
                  ref={scannerContainerRef}
                  className="quagga-scanner relative border-2 border-purple-300 rounded-lg overflow-hidden bg-black"
                  style={{ height: '300px' }}
                >
                  {/* Scanner overlay guides */}
                  <div className="scanner-overlay"></div>
                  
                  {/* Instructions overlay */}
                  <div className="absolute top-4 left-4 right-4 text-white text-center bg-black bg-opacity-50 rounded p-2 z-20">
                    <div className="flex items-center justify-center space-x-2">
                      <ScanLine className="h-4 w-4 animate-pulse" />
                      <span className="text-sm">Point camera at barcode</span>
                    </div>
                  </div>

                  {/* Bottom status bar */}
                  <div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black bg-opacity-50 rounded p-2 z-20">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs">Scanner Active</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-3 space-y-2">
                <p className="text-sm text-gray-600">
                  📹 Real-time barcode detection enabled
                </p>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={simulateCameraScan}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  >
                    Demo Scan
                  </button>
                  <button
                    onClick={stopCameraScanning}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Supports: EAN-13, UPC-A, Code 128, Code 39
                </p>
              </div>
            </div>
          )}
          
          {/* Quick Test Barcodes */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Test (Click to scan):</p>
            <div className="flex flex-wrap gap-2">
              {products.slice(0, 4).map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleBarcodeScanned(product.barcode, 'test')}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  {product.name}: {product.barcode}
                </button>
              ))}
            </div>
          </div>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Recent Scans:</p>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {scanHistory.slice(0, 5).map((scan, index) => (
                  <div key={index} className="flex justify-between text-xs text-gray-600">
                    <span className="font-mono">{scan.barcode}</span>
                    <span className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                        scan.source === 'camera' ? 'bg-purple-400' :
                        scan.source === 'scanner' ? 'bg-blue-400' :
                        scan.source === 'test' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></span>
                      {scan.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, code, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.code}</p>
                        <p className="text-lg font-bold text-blue-600">
                          ₹{product.pricing?.sellingPrice?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Stock: {product.inventory?.currentStock || 0}
                        </p>
                        {(product.inventory?.currentStock || 0) <= 5 && (
                          <span className="inline-flex items-center text-xs text-yellow-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredProducts.length === 0 && searchTerm && (
                <div className="text-center py-8 text-gray-500">
                  No products found matching "{searchTerm}"
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Combos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Available Combo Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCombos.filter(combo => combo.isActive).map((combo) => {
                  const eligibleProducts = (combo.applicableProducts || []);
                  const hasEligibleProducts = eligibleProducts.length === 0 || 
                    eligibleProducts.some(productId => cart.some(item => item._id === productId));
                  
                  if (!hasEligibleProducts) return null;
                  
                  const estimatedSavings = calculateComboSavings(combo);
                  
                  return (
                    <div
                      key={combo._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedCombo?._id === combo._id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                      onClick={() => applyCombo(combo)}
                    >
                      <h3 className="font-medium text-gray-900">{combo.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{combo.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            {combo.discountType === 'percentage' 
                              ? `${combo.discountValue}% off` 
                              : `₹${combo.discountValue} off`}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            Save ₹{estimatedSavings}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {eligibleProducts.length > 0 
                              ? `${eligibleProducts.length} products` 
                              : 'All products'}
                          </p>
                          <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded mt-1">
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Billing */}
        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart ({cart.length})
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear All
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Add products to start billing</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => {
                    const isRecentlyScanned = item.lastScanned && 
                      (new Date() - new Date(item.lastScanned)) < 3000; // 3 seconds
                    
                    return (
                      <div 
                        key={item._id} 
                        className={`flex items-center justify-between border-b pb-3 transition-all duration-300 ${
                          isRecentlyScanned 
                            ? 'bg-green-50 border-green-200 animate-pulse' 
                            : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            {isRecentlyScanned && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <ScanLine className="h-3 w-3 mr-1" />
                                Scanned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{item.code}</p>
                          <p className="text-xs text-gray-400">Barcode: {item.barcode}</p>
                          <p className="text-sm font-bold">
                            ₹{item.pricing?.sellingPrice?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center border rounded">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 min-w-[40px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bill Summary */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Discount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Additional Discount</label>
                  <div className="flex space-x-2">
                    <select
                      value={discount.type}
                      onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">₹</option>
                    </select>
                    <input
                      type="number"
                      placeholder="0"
                      value={discount.value}
                      onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculateSubtotal().toLocaleString()}</span>
                  </div>
                  
                  {selectedCombo && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-green-800">{selectedCombo.name}</p>
                          <p className="text-xs text-green-600">
                            {selectedCombo.discountType === 'percentage' 
                              ? `${selectedCombo.discountValue}% off` 
                              : `₹${selectedCombo.discountValue} off`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-medium">
                            -₹{calculateComboDiscount().toLocaleString()}
                          </span>
                          <button 
                            onClick={removeCombo}
                            className="text-red-500 hover:text-red-700 text-xs p-1"
                            title="Remove combo"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {discount.value > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Additional Discount:</span>
                      <span>-₹{calculateDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={processBill}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Generate Bill
                  </button>
                  <button
                    onClick={printBill}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Print Bill
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Payment</h3>
              
              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${
                      paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <Banknote className="h-5 w-5" />
                    <span className="text-xs">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${
                      paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${
                      paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span className="text-xs">UPI</span>
                  </button>
                </div>
              </div>

              {/* Amount Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Cash Payment Input */}
              {paymentMethod === 'cash' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Received Amount</label>
                  <input
                    type="number"
                    placeholder="Enter received amount"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {receivedAmount && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Change: </span>
                      <span className="font-semibold text-green-600">
                        ₹{Math.max(0, parseFloat(receivedAmount) - calculateTotal()).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6" id="receipt">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Your Store Name</h2>
                <p className="text-sm text-gray-600">123 Store Address, City</p>
                <p className="text-sm text-gray-600">Phone: +91 98765 43210</p>
                <div className="border-t border-b border-gray-300 py-2 my-3">
                  <p className="font-medium">SALES RECEIPT</p>
                  <p className="text-sm">#{lastBill.billNumber}</p>
                  <p className="text-sm">{lastBill.date.toLocaleString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              {(lastBill.customer.name || lastBill.customer.phone) && (
                <div className="mb-4">
                  <h4 className="font-medium">Customer:</h4>
                  {lastBill.customer.name && <p className="text-sm">{lastBill.customer.name}</p>}
                  {lastBill.customer.phone && <p className="text-sm">{lastBill.customer.phone}</p>}
                </div>
              )}

              {/* Items */}
              <div className="mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Item</th>
                      <th className="text-center py-1">Qty</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastBill.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-1">
                          <div>{item.name}</div>
                          <div className="text-xs text-gray-500">@₹{item.price.toLocaleString()}</div>
                        </td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">₹{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{lastBill.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹{lastBill.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{lastBill.total.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{lastBill.paymentMethod}</span>
                  </div>
                  {lastBill.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between">
                        <span>Received:</span>
                        <span>₹{lastBill.receivedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span>₹{lastBill.change.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-center mt-6 text-sm text-gray-600">
                <p>Thank you for your business!</p>
                <p>Visit again soon</p>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={printReceipt}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Receipt className="h-4 w-4" />
                Print Receipt
              </button>
              <button
                onClick={newSale}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;

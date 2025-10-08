const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please add category']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Please add vendor']
  },
  // Product Type: parent (bundle) or child (individual)
  type: {
    type: String,
    enum: ['parent', 'child', 'standalone'],
    default: 'standalone',
    required: true
  },
  
  // Bundle Configuration (for parent products)
  bundle: {
    isBundle: {
      type: Boolean,
      default: false
    },
    bundleType: {
      type: String,
      enum: ['same_size_different_colors', 'different_sizes_same_color', 'different_sizes_different_colors', 'custom'],
      default: 'custom',
      required: function() { return this.isBundle; }
    },
    bundleSize: {
      type: Number,
      default: 1,
      min: [1, 'Bundle size cannot be less than 1'],
      max: [100, 'Bundle size cannot exceed 100 (1 parent + 99 children)']
    },
    childrenCount: {
      type: Number,
      default: 0,
      max: [99, 'Cannot have more than 99 child products']
    },
    autoGenerateChildren: {
      type: Boolean,
      default: true
    },
    bundlePrefix: {
      type: String,
      maxlength: [10, 'Bundle prefix cannot exceed 10 characters']
    },
    // Bundle configuration for automated generation
    bundleConfig: {
      baseSize: String, // For same size, different colors (e.g., 'L')
      baseColor: String, // For different sizes, same color (e.g., 'Red')
      sizes: [String], // Array of sizes: ['S', 'M', 'L', 'XL', 'XXL']
      colors: [String], // Array of colors: ['Red', 'Blue', 'Green', 'Black', 'White']
      quantity: {
        type: Number,
        default: 1
      }, // Base quantity for each variant
      priceVariation: {
        type: Number,
        default: 0 // Price difference for variants (+ or - from base price)
      },
      // Advanced configuration
      generateBarcodes: {
        type: Boolean,
        default: true
      },
      useSmartCoding: {
        type: Boolean,
        default: true // Use category+subcategory+bundletype+serial coding
      }
    }
  },
  
  // Parent-Child Relationship
  parentProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  
  // Child Product Configuration
  childConfig: {
    serialNumber: {
      type: Number,
      min: [1, 'Serial number must be at least 1'],
      max: [99, 'Serial number cannot exceed 99']
    },
    inheritFromParent: {
      pricing: {
        type: Boolean,
        default: true
      },
      specifications: {
        type: Boolean,
        default: true
      },
      category: {
        type: Boolean,
        default: true
      },
      vendor: {
        type: Boolean,
        default: true
      },
      gst: {
        type: Boolean,
        default: true
      }
    }
  },
  pricing: {
    costPrice: {
      type: Number,
      required: [true, 'Please add cost price'],
      min: [0, 'Cost price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please add selling price'],
      min: [0, 'Selling price cannot be negative']
    },
    mrp: {
      type: Number,
      required: [true, 'Please add MRP'],
      min: [0, 'MRP cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    wholesalePrice: {
      type: Number,
      min: [0, 'Wholesale price cannot be negative']
    }
  },
  inventory: {
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: [0, 'Min stock level cannot be negative']
    },
    maxStockLevel: {
      type: Number,
      default: 1000,
      min: [0, 'Max stock level cannot be negative']
    },
    reorderPoint: {
      type: Number,
      default: 20,
      min: [0, 'Reorder point cannot be negative']
    },
    location: {
      type: String,
      maxlength: [50, 'Location cannot be more than 50 characters']
    }
  },
  specifications: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'inch', 'mm'],
        default: 'cm'
      }
    },
    color: String,
    size: String,
    material: String
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  tags: [String],
  hsnCode: {
    type: String,
    match: [/^[0-9]{4,8}$/, 'Please enter valid HSN code']
  },
  gstRate: {
    type: Number,
    enum: [0, 5, 12, 18, 28],
    default: 18
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isComboEligible: {
    type: Boolean,
    default: true
  },
  totalSold: {
    type: Number,
    default: 0,
    min: [0, 'Total sold cannot be negative']
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: [0, 'Total revenue cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ code: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ type: 1 });
productSchema.index({ parentProduct: 1 });
productSchema.index({ 'pricing.sellingPrice': 1 });
productSchema.index({ 'inventory.currentStock': 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isComboEligible: 1 });

// Generate product code with enhanced logic matching screenshot format
productSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    const category = await mongoose.model('Category').findById(this.category);
    const subcategory = this.subcategory ? await mongoose.model('Category').findById(this.subcategory) : null;
    
    // Build code components based on screenshot format
    const catPrefix = category ? category.code.substring(0, 3).toUpperCase() : 'GEN';
    const subPrefix = subcategory ? subcategory.code.substring(0, 2).toUpperCase() : 'XX';
    
    // Bundle type prefix (matching your screenshot style)
    let bundlePrefix = '';
    if (this.bundle?.isBundle && this.type === 'parent') {
      const bundleTypes = {
        'same_size_different_colors': 'SC', // Same Color, Different Sizes
        'different_sizes_same_color': 'DS', // Different Sizes, Same Color  
        'different_sizes_different_colors': 'DC', // Different Colors & Sizes
        'custom': 'CT' // Custom bundle
      };
      bundlePrefix = bundleTypes[this.bundle.bundleType] || 'CT';
    } else if (this.type === 'child') {
      bundlePrefix = 'CH';
    } else {
      bundlePrefix = 'ST'; // Standalone
    }
    
    // Enhanced serial number generation with category filtering
    const filterQuery = {
      category: this.category
    };
    
    if (this.subcategory) {
      filterQuery.subcategory = this.subcategory;
    }
    
    if (this.bundle?.bundleType) {
      filterQuery['bundle.bundleType'] = this.bundle.bundleType;
    }
    
    const existingCount = await this.constructor.countDocuments(filterQuery);
    const serialNumber = (existingCount + 1).toString().padStart(6, '0');
    
    // Format: CATEGORY/SUBCATEGORY/BUNDLETYPE/SERIAL 
    // Example: SHI/MW/SC/000001 (like your screenshot shows)
    this.code = `${catPrefix}/${subPrefix}/${bundlePrefix}/${serialNumber}`;
  }
  next();
});

// Enhanced barcode generation supporting multiple formats
productSchema.pre('save', function(next) {
  if (this.isNew && !this.barcode) {
    // Generate barcode based on product code (matching screenshot style)
    const productCodeDigits = this.code.replace(/[^0-9]/g, ''); // Extract only numbers
    const timestamp = Date.now().toString().slice(-4);
    
    if (this.bundle?.generateBarcodes !== false) {
      // For bundle products, generate systematic barcodes
      if (this.type === 'parent') {
        // Parent barcode: 8901234 + 5 digits from code + check digit
        const baseCode = `8901234${productCodeDigits.slice(-5).padStart(5, '0')}`;
        const checkDigit = this.calculateCheckDigit(baseCode);
        this.barcode = baseCode + checkDigit;
      } else if (this.type === 'child') {
        // Child barcode: 8901235 + serial + variant + check digit
        const serial = this.childConfig?.serialNumber?.toString().padStart(2, '0') || '01';
        const baseCode = `8901235${productCodeDigits.slice(-3).padStart(3, '0')}${serial}`;
        const checkDigit = this.calculateCheckDigit(baseCode);
        this.barcode = baseCode + checkDigit;
      } else {
        // Standalone product: 8901236 + timestamp + code
        const baseCode = `8901236${timestamp}${productCodeDigits.slice(-1)}`;
        const checkDigit = this.calculateCheckDigit(baseCode);
        this.barcode = baseCode + checkDigit;
      }
    } else {
      // Standard EAN-13 barcode
      const prefix = '890'; // Country code for India
      const company = '12345'; // Company identifier
      const product = productCodeDigits.slice(-5).padStart(5, '0');
      const checkDigit = this.calculateCheckDigit(`${prefix}${company}${product}`);
      this.barcode = `${prefix}${company}${product}${checkDigit}`;
    }
  }
  next();
});

// Generate SKU
productSchema.pre('save', function(next) {
  if (this.isNew && !this.sku) {
    const namePrefix = this.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const timestamp = Date.now().toString().slice(-4);
    this.sku = `${namePrefix}${timestamp}`;
  }
  next();
});

// Calculate check digit for barcode
productSchema.methods.calculateCheckDigit = function(code) {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
};

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.pricing.costPrice === 0) return 0;
  return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice * 100).toFixed(2);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.inventory.currentStock === 0) return 'out_of_stock';
  if (this.inventory.currentStock <= this.inventory.reorderPoint) return 'low_stock';
  if (this.inventory.currentStock <= this.inventory.minStockLevel) return 'min_stock';
  return 'in_stock';
});

// Virtual for child products (if this is a parent)
productSchema.virtual('childProducts', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'parentProduct',
  justOne: false
});

// Virtual for bundle status
productSchema.virtual('bundleStatus').get(function() {
  if (this.type === 'parent' && this.bundle.isBundle) {
    return {
      isComplete: this.bundle.childrenCount === this.bundle.bundleSize - 1,
      remaining: Math.max(0, this.bundle.bundleSize - 1 - this.bundle.childrenCount),
      progress: Math.round((this.bundle.childrenCount / (this.bundle.bundleSize - 1)) * 100)
    };
  }
  return null;
});

// Virtual for full product hierarchy
productSchema.virtual('productHierarchy').get(function() {
  if (this.type === 'parent') {
    return `${this.name} (Bundle of ${this.bundle.bundleSize})`;
  } else if (this.type === 'child' && this.parentProduct) {
    return `${this.name} (Child #${this.childConfig.serialNumber})`;
  }
  return this.name;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

// Method to create child products for bundle
productSchema.methods.createChildProducts = async function(userId) {
  if (this.type !== 'parent' || !this.bundle.isBundle) {
    throw new Error('Only parent bundle products can create children');
  }
  
  const childProducts = [];
  const config = this.bundle.bundleConfig || {};
  
  // Debug logging
  console.log('Creating child products for bundle:');
  console.log('Bundle Type:', this.bundle.bundleType);
  console.log('Bundle Config:', JSON.stringify(config, null, 2));
  console.log('Bundle Size:', this.bundle.bundleSize);
  console.log('Parent Inventory:', this.inventory.currentStock);
  
  // Generate variants based on bundle type
  let variants = [];
  
  switch (this.bundle.bundleType) {
    case 'same_size_different_colors':
      // Same size, different colors - create variants for all colors
      const baseSize = config.baseSize || (config.sizes && config.sizes[0]) || 'M';
      const colors = config.colors || ['Red', 'Blue', 'Green'];
      // Create variants for all colors except the first one (parent will be first color)
      variants = colors.slice(1).map((color, index) => ({
        size: baseSize,
        color: color,
        name: `${this.name} - ${baseSize} - ${color}`
      }));
      break;
      
    case 'different_sizes_same_color':
      // Different sizes, same color - create variants for all sizes
      const baseColor = config.baseColor || (config.colors && config.colors[0]) || 'Black';
      const sizes = config.sizes || ['S', 'M', 'L', 'XL'];
      // Create variants for all sizes except the first one (parent will be first size)
      variants = sizes.slice(1).map((size, index) => ({
        size: size,
        color: baseColor,
        name: `${this.name} - ${size} - ${baseColor}`
      }));
      break;
      
    case 'different_sizes_different_colors':
      // All combinations of sizes and colors
      const allSizes = config.sizes || ['S', 'M', 'L'];
      const allColors = config.colors || ['Red', 'Blue'];
      allSizes.forEach(size => {
        allColors.forEach(color => {
          variants.push({
            size: size,
            color: color,
            name: `${this.name} - ${size} - ${color}`
          });
        });
      });
      break;
      
    default:
      // If we have sizes or colors in config, use them instead of defaults
      if (config.sizes && config.sizes.length > 1) {
        // Use sizes
        const sizes = config.sizes;
        const baseColor = config.baseColor || (config.colors && config.colors[0]) || 'Default';
        variants = sizes.slice(1).map((size, index) => ({
          size: size,
          color: baseColor,
          name: `${this.name} - ${size} - ${baseColor}`
        }));
      } else if (config.colors && config.colors.length > 1) {
        // Use colors
        const colors = config.colors;
        const baseSize = config.baseSize || (config.sizes && config.sizes[0]) || 'Standard';
        variants = colors.slice(1).map((color, index) => ({
          size: baseSize,
          color: color,
          name: `${this.name} - ${baseSize} - ${color}`
        }));
      } else {
        // Fallback to numbered variants
        const targetCount = Math.min(this.bundle.bundleSize - 1, 99);
        for (let i = 1; i <= targetCount; i++) {
          variants.push({
            size: 'Standard',
            color: 'Default',
            name: `${this.name} - Item ${i.toString().padStart(2, '0')}`
          });
        }
      }
  }
  
  // Limit variants to bundleSize - 1
  variants = variants.slice(0, this.bundle.bundleSize - 1);
  
  // Create child products
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const childData = {
      name: variant.name,
      code: `${this.code}/${(i + 1).toString().padStart(2, '0')}`, // Generate child code
      barcode: this.barcode ? `${this.barcode}${(i + 1).toString().padStart(2, '0')}` : undefined,
      type: 'child',
      parentProduct: this._id,
      childConfig: {
        serialNumber: i + 1,
        variant: {
          size: variant.size,
          color: variant.color
        },
        inheritFromParent: {
          pricing: true,
          specifications: true,
          category: true,
          vendor: true,
          gst: true
        }
      },
      category: this.category,
      vendor: this.vendor,
      createdBy: userId
    };
    
    // Inherit properties based on configuration
    if (childData.childConfig?.inheritFromParent?.pricing !== false) {
      const priceAdjustment = config.priceVariation || 0;
      childData.pricing = {
        costPrice: this.pricing.costPrice + priceAdjustment,
        sellingPrice: this.pricing.sellingPrice + priceAdjustment,
        mrp: this.pricing.mrp + priceAdjustment,
        discount: this.pricing.discount || 0,
        wholesalePrice: (this.pricing.wholesalePrice || this.pricing.sellingPrice * 0.9) + priceAdjustment
      };
    }
    
    // Always set specifications for child products with variant details
    const parentSpecs = this.specifications || {};
    childData.specifications = { 
      weight: parentSpecs.weight,
      dimensions: parentSpecs.dimensions || undefined, // Don't set if undefined
      color: variant.color,
      size: variant.size,
      material: parentSpecs.material,
      brand: parentSpecs.brand,
      model: parentSpecs.model,
      warrantyPeriod: parentSpecs.warrantyPeriod
    };
    
    // Remove undefined fields to avoid validation errors
    Object.keys(childData.specifications).forEach(key => {
      if (childData.specifications[key] === undefined) {
        delete childData.specifications[key];
      }
    });
    
    if (childData.childConfig?.inheritFromParent?.gst !== false) {
      childData.hsnCode = this.hsnCode;
      childData.gstRate = this.gstRate;
    }
    
    // Set initial inventory with proper quantity distribution
    const totalQuantity = this.inventory.currentStock || 0; // Use parent's current stock as total
    const totalVariants = variants.length + 1; // +1 for parent
    const variantQuantity = Math.floor(totalQuantity / totalVariants);
    
    childData.inventory = {
      currentStock: variantQuantity,
      minStockLevel: this.inventory.minStockLevel,
      maxStockLevel: this.inventory.maxStockLevel,
      reorderPoint: this.inventory.reorderPoint,
      location: this.inventory.location
    };
    
    // Copy other properties
    childData.description = `${this.description} - ${variant.size} ${variant.color}`;
    childData.tags = [...(this.tags || [])];
    childData.isActive = this.isActive;
    childData.isComboEligible = this.isComboEligible;
    
    const childProduct = new this.constructor(childData);
    await childProduct.save();
    childProducts.push(childProduct);
  }
  
  // Update parent's children count and adjust parent stock
  this.bundle.childrenCount = childProducts.length;
  
  // Set parent's stock to the calculated parent quantity
  const totalQuantity = this.inventory.currentStock || 0; // Use parent's current stock as total
  const totalVariants = variants.length + 1; // +1 for parent
  const variantQuantity = Math.floor(totalQuantity / totalVariants);
  const parentQuantity = totalQuantity - (variantQuantity * variants.length); // Parent gets remainder
  
  console.log('=== QUANTITY DISTRIBUTION DEBUG ===');
  console.log('Total Quantity:', totalQuantity);
  console.log('Total Variants (including parent):', totalVariants);
  console.log('Quantity per variant:', variantQuantity);
  console.log('Children count:', variants.length);
  console.log('Parent quantity (remainder):', parentQuantity);
  console.log('=== END QUANTITY DEBUG ===');
  
  this.inventory.currentStock = parentQuantity;
  
  // Set parent's specifications to match the first variant (if available)
  if (config.sizes && config.sizes.length > 0 && config.colors && config.colors.length > 0) {
    // Ensure specifications object exists and handle dimensions properly
    const currentSpecs = this.specifications || {};
    
    if (this.bundle.bundleType === 'same_size_different_colors') {
      // For same size different colors, parent should have the base size and first color
      this.specifications = {
        weight: currentSpecs.weight,
        material: currentSpecs.material,
        brand: currentSpecs.brand,
        model: currentSpecs.model,
        warrantyPeriod: currentSpecs.warrantyPeriod,
        size: config.baseSize || config.sizes[0],
        color: config.colors[0]
      };
      // Only add dimensions if it exists and is not empty
      if (currentSpecs.dimensions && Object.keys(currentSpecs.dimensions).length > 0) {
        this.specifications.dimensions = currentSpecs.dimensions;
      }
    } else if (this.bundle.bundleType === 'different_sizes_same_color') {
      // For different sizes same color, parent should have first size and base color
      this.specifications = {
        weight: currentSpecs.weight,
        material: currentSpecs.material,
        brand: currentSpecs.brand,
        model: currentSpecs.model,
        warrantyPeriod: currentSpecs.warrantyPeriod,
        size: config.sizes[0],
        color: config.baseColor || config.colors[0]
      };
      // Only add dimensions if it exists and is not empty
      if (currentSpecs.dimensions && Object.keys(currentSpecs.dimensions).length > 0) {
        this.specifications.dimensions = currentSpecs.dimensions;
      }
    } else {
      // Default case - use first available values
      this.specifications = {
        weight: currentSpecs.weight,
        material: currentSpecs.material,
        brand: currentSpecs.brand,
        model: currentSpecs.model,
        warrantyPeriod: currentSpecs.warrantyPeriod,
        size: config.sizes[0] || 'Standard',
        color: config.colors[0] || 'Default'
      };
      // Only add dimensions if it exists and is not empty
      if (currentSpecs.dimensions && Object.keys(currentSpecs.dimensions).length > 0) {
        this.specifications.dimensions = currentSpecs.dimensions;
      }
    }
  }
  
  await this.save();
  
  return childProducts;
};

// Method to update child products when parent changes
productSchema.methods.updateChildProducts = async function(updateFields = {}) {
  if (this.type !== 'parent' || !this.bundle.isBundle) {
    throw new Error('Only parent bundle products can update children');
  }
  
  const childProducts = await this.constructor.find({ parentProduct: this._id });
  
  for (const child of childProducts) {
    let hasChanges = false;
    
    // Update pricing if inherited
    if (child.childConfig?.inheritFromParent?.pricing && updateFields.pricing) {
      child.pricing = { ...child.pricing, ...updateFields.pricing };
      hasChanges = true;
    }
    
    // Update specifications if inherited
    if (child.childConfig?.inheritFromParent?.specifications && updateFields.specifications) {
      child.specifications = { ...child.specifications, ...updateFields.specifications };
      hasChanges = true;
    }
    
    // Update GST if inherited
    if (child.childConfig?.inheritFromParent?.gst && (updateFields.hsnCode || updateFields.gstRate)) {
      if (updateFields.hsnCode) child.hsnCode = updateFields.hsnCode;
      if (updateFields.gstRate) child.gstRate = updateFields.gstRate;
      hasChanges = true;
    }
    
    // Update category if inherited
    if (child.childConfig?.inheritFromParent?.category && updateFields.category) {
      child.category = updateFields.category;
      hasChanges = true;
    }
    
    // Update vendor if inherited
    if (child.childConfig?.inheritFromParent?.vendor && updateFields.vendor) {
      child.vendor = updateFields.vendor;
      hasChanges = true;
    }
    
    if (hasChanges) {
      await child.save();
    }
  }
};

// Method to get bundle summary
productSchema.methods.getBundleSummary = async function() {
  if (this.type !== 'parent' || !this.bundle.isBundle) {
    return null;
  }
  
  const childProducts = await this.constructor.find({ parentProduct: this._id })
    .select('name code barcode inventory.currentStock pricing.sellingPrice isActive');
  
  const totalStock = childProducts.reduce((sum, child) => sum + child.inventory.currentStock, 0);
  const totalValue = childProducts.reduce((sum, child) => 
    sum + (child.inventory.currentStock * child.pricing.sellingPrice), 0);
  
  return {
    parentProduct: {
      id: this._id,
      name: this.name,
      code: this.code,
      totalStock: this.inventory.currentStock
    },
    childProducts: childProducts.map(child => ({
      id: child._id,
      name: child.name,
      code: child.code,
      barcode: child.barcode,
      stock: child.inventory.currentStock,
      value: child.inventory.currentStock * child.pricing.sellingPrice,
      isActive: child.isActive
    })),
    summary: {
      totalChildren: childProducts.length,
      expectedChildren: this.bundle.bundleSize - 1,
      isComplete: childProducts.length === (this.bundle.bundleSize - 1),
      totalStock: totalStock + this.inventory.currentStock,
      totalValue: totalValue + (this.inventory.currentStock * this.pricing.sellingPrice),
      activeChildren: childProducts.filter(child => child.isActive).length
    }
  };
};

// Static method to get low stock products
productSchema.statics.getLowStockProducts = function() {
  return this.find({
    isActive: true,
    $expr: { $lte: ['$inventory.currentStock', '$inventory.minStockLevel'] }
  }).populate('category vendor');
};

// Static method to create bundle with children
productSchema.statics.createBundleWithChildren = async function(bundleData, userId) {
  // Validate bundle size
  if (!bundleData.bundle?.bundleSize || bundleData.bundle.bundleSize < 2 || bundleData.bundle.bundleSize > 100) {
    throw new Error('Bundle size must be between 2 and 100');
  }
  
  // Create parent product
  const parentData = {
    ...bundleData,
    type: 'parent',
    bundle: {
      isBundle: true,
      bundleType: bundleData.bundle.bundleType || 'custom',
      bundleSize: bundleData.bundle.bundleSize,
      childrenCount: 0,
      autoGenerateChildren: bundleData.bundle.autoGenerateChildren !== false,
      bundlePrefix: bundleData.bundle.bundlePrefix || bundleData.name.substring(0, 5).toUpperCase(),
      bundleConfig: bundleData.bundle.bundleConfig || {}
    },
    createdBy: userId
  };
  
  const parentProduct = new this(parentData);
  await parentProduct.save();
  
  // Auto-generate children if requested
  if (parentProduct.bundle.autoGenerateChildren) {
    await parentProduct.createChildProducts(userId);
  }
  
  return parentProduct;
};

// Static method to get all bundles
productSchema.statics.getBundles = function(options = {}) {
  const query = {
    type: 'parent',
    'bundle.isBundle': true,
    isActive: true
  };
  
  if (options.includeInactive) {
    delete query.isActive;
  }
  
  return this.find(query)
    .populate('category vendor childProducts')
    .sort({ 'bundle.bundleSize': -1, name: 1 });
};

// Static method to get bundle analytics
productSchema.statics.getBundleAnalytics = function() {
  return this.aggregate([
    {
      $match: {
        type: 'parent',
        'bundle.isBundle': true
      }
    },
    {
      $group: {
        _id: null,
        totalBundles: { $sum: 1 },
        averageBundleSize: { $avg: '$bundle.bundleSize' },
        completedBundles: {
          $sum: {
            $cond: [
              { $eq: ['$bundle.childrenCount', { $subtract: ['$bundle.bundleSize', 1] }] },
              1,
              0
            ]
          }
        },
        totalBundleValue: {
          $sum: {
            $multiply: ['$inventory.currentStock', '$pricing.sellingPrice']
          }
        }
      }
    },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $eq: ['$totalBundles', 0] },
            0,
            { $multiply: [{ $divide: ['$completedBundles', '$totalBundles'] }, 100] }
          ]
        }
      }
    }
  ]);
};

// Static method to bulk create products from CSV/Excel
productSchema.statics.bulkCreateProducts = async function(productsData, userId, options = {}) {
  const results = {
    success: [],
    errors: [],
    bundles: []
  };
  
  for (const productData of productsData) {
    try {
      // Check if this should be a bundle
      if (productData.bundle?.isBundle && productData.bundle?.bundleSize > 1) {
        const bundle = await this.createBundleWithChildren(productData, userId);
        results.bundles.push({
          parent: bundle,
          children: await bundle.constructor.find({ parentProduct: bundle._id })
        });
      } else {
        // Create standalone product
        const product = new this({
          ...productData,
          type: 'standalone',
          createdBy: userId
        });
        await product.save();
        results.success.push(product);
      }
    } catch (error) {
      results.errors.push({
        productData,
        error: error.message
      });
    }
  }
  
  return results;
};

module.exports = mongoose.model('Product', productSchema);
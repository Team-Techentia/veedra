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
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
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
      default: 2,
      min: [2, 'Bundle size must be at least 2 (1 parent + 1 child)']
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
      // Custom quantities configuration
      mixedConfig: [{
        key: String, // e.g., "color-Red", "size-M"
        color: String,
        size: String,
        quantity: {
          type: Number,
          default: 0
        }
      }],
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
    factoryPrice: {
      type: Number,
      required: [true, 'Please add factory price'],
      min: [0, 'Factory price cannot be negative']
    },
    offerPrice: {
      type: Number,
      required: [true, 'Please add offer price'],
      min: [0, 'Offer price cannot be negative']
    },
    discountedPrice: {
      type: Number,
      required: [true, 'Please add discounted price'],
      min: [0, 'Discounted price cannot be negative']
    },
    mrp: {
      type: Number,
      required: [true, 'Please add MRP'],
      min: [0, 'MRP cannot be negative']
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
productSchema.index({ 'pricing.offerPrice': 1 });
productSchema.index({ 'inventory.currentStock': 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isComboEligible: 1 });

// Generate product code with enhanced logic matching screenshot format
productSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    // For child products, use parent's code with sequential suffix
    if (this.type === 'child' && this.parentProduct) {
      const parent = await this.constructor.findById(this.parentProduct);
      if (!parent) throw new Error('Parent product not found');
      
      // Get next available child number
      const siblings = await this.constructor.find({ parentProduct: this.parentProduct });
      const nextChildNum = (siblings.length + 1).toString().padStart(2, '0');
      
      this.code = `${parent.code}/${nextChildNum}`;
      return next();
    }
    
    const category = await mongoose.model('Category').findById(this.category);
    
    // Build code components based on screenshot format
    const catPrefix = category ? category.code.substring(0, 3).toUpperCase() : 'GEN';
    
    // Find latest product in this category
    const filterQuery = {
      category: this.category,
      type: { $ne: 'child' } // Exclude child products
    };
    
    const existingProducts = await this.constructor
      .find(filterQuery)
      .sort({ code: -1 })
      .limit(1);
    
    let nextNumber = 1;
    
    if (existingProducts.length > 0) {
      const lastCode = existingProducts[0].code;
      const match = lastCode.match(/A(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    // Format: SHI/WTS/A00002
    this.code = `${catPrefix}/WTS/A${nextNumber.toString().padStart(5, '0')}`;
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
  if (this.pricing.factoryPrice === 0) return 0;
  return ((this.pricing.offerPrice - this.pricing.factoryPrice) / this.pricing.factoryPrice * 100).toFixed(2);
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
  
  // Critical check: ensure parent has an ID
  if (!this._id) {
    throw new Error('Parent product must be saved before creating children - no _id found');
  }
  
  const childProducts = [];
  const config = this.bundle.bundleConfig || {};
  
  // Generate variants based on bundle type
  const variants = [];
  let parentQuantity = 0;
  
  // For mixed size mixed color bundles, we create multiple child products with quantity 1 each
  // For other bundle types, we require custom quantities
  if (this.bundle.bundleType !== 'different_sizes_different_colors' && 
      (!config.mixedConfig || config.mixedConfig.length === 0)) {
    throw new Error('Bundle creation requires custom quantities in mixedConfig for this bundle type.');
  }

  // Handle different bundle types
  if (this.bundle.bundleType === 'different_sizes_different_colors') {
    // For mixed size mixed color, use 1+(n-1) structure:
    // Parent gets 1 quantity, rest are child products
    const totalStock = this.inventory.currentStock || 0;
    
    if (totalStock < 2) {
      throw new Error('Mixed bundle must have at least 2 items (1 parent + 1 child product)');
    }
    
    parentQuantity = 1; // Parent keeps 1
    
    // Create (n-1) child variants for mixed bundles, each with quantity 1
    const numChildren = totalStock - 1;
    for (let i = 0; i < numChildren; i++) {
      const childNumber = (i + 1).toString().padStart(2, '0');
      variants.push({
        size: 'Mixed',
        color: 'Mixed',
        name: `${this.name} - Mixed Bundle`,
        customQuantity: 1, // Each child gets quantity of 1
        serialNumber: i + 1,
        type: 'child'
      });
    }
  } else {
    // Process each item in mixedConfig
    const mixedItems = config.mixedConfig;
    
    switch (this.bundle.bundleType) {
      case 'same_size_different_colors':
        const baseColor = config.baseColor || (config.colors && config.colors[0]) || 'Red';
        const baseSize = config.baseSize || (config.sizes && config.sizes[0]) || 'M';
        
        // Find parent quantity (base color)
        const parentColorItem = mixedItems.find(item => item.color === baseColor);
        parentQuantity = parentColorItem ? parentColorItem.quantity : 0;
        
        // Create variants for non-base colors
        mixedItems.forEach(item => {
          if (item.color !== baseColor && item.quantity > 0) {
            variants.push({
              size: baseSize,
              color: item.color,
              name: `${this.name} - ${baseSize} - ${item.color.toLowerCase()}`,
              customQuantity: item.quantity
            });
          }
        });
        break;
        
      case 'different_sizes_same_color':
        const baseSize2 = config.baseSize || (config.sizes && config.sizes[0]) || 'M';
        const baseColor2 = config.baseColor || (config.colors && config.colors[0]) || 'Black';
        
        // Find parent quantity (base size)
        const parentSizeItem = mixedItems.find(item => item.size === baseSize2);
        parentQuantity = parentSizeItem ? parentSizeItem.quantity : 0;
        
        // Create variants for non-base sizes
        mixedItems.forEach(item => {
          if (item.size !== baseSize2 && item.quantity > 0) {
            variants.push({
              size: item.size,
              color: baseColor2,
              name: `${this.name} - ${item.size} - ${baseColor2.toLowerCase()}`,
              customQuantity: item.quantity
            });
          }
        });
        break;
        
      case 'different_sizes_different_colors':
        // For this type with mixedConfig, all items become children, parent gets 0
        parentQuantity = 0;
        mixedItems.forEach(item => {
          if (item.quantity > 0) {
            variants.push({
              size: item.size,
              color: item.color,
              name: `${this.name} - ${item.size} - ${item.color.toLowerCase()}`,
              customQuantity: item.quantity
            });
          }
        });
        break;
        
      default:
        throw new Error(`Unsupported bundle type: ${this.bundle.bundleType}`);
    }
  }
  
  // Update bundle size to match actual number of variants if not specified
  if (!this.bundle.bundleSize || this.bundle.bundleSize < variants.length + 1) {
    this.bundle.bundleSize = variants.length + 1; // +1 for parent
  }
  
  // Remove duplicate variants declaration
  
  // Create child products
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const childData = {
      name: variant.name,
      code: `${this.code}/${(i + 1).toString().padStart(2, '0')}`,
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
    
    // Inherit pricing
    const priceAdjustment = config.priceVariation || 0;
    childData.pricing = {
      factoryPrice: this.pricing.factoryPrice + priceAdjustment,
      offerPrice: this.pricing.offerPrice + priceAdjustment,
      discountedPrice: this.pricing.discountedPrice + priceAdjustment,
      mrp: this.pricing.mrp + priceAdjustment
    };
    
    // Set specifications with variant details
    const parentSpecs = this.specifications || {};
    childData.specifications = { 
      weight: parentSpecs.weight,
      color: variant.color,
      size: variant.size,
      material: parentSpecs.material,
      brand: parentSpecs.brand,
      model: parentSpecs.model,
      warrantyPeriod: parentSpecs.warrantyPeriod
    };
    
    // Add dimensions only if it exists
    if (parentSpecs.dimensions && Object.keys(parentSpecs.dimensions).length > 0) {
      childData.specifications.dimensions = parentSpecs.dimensions;
    }
    
    // Remove undefined fields
    Object.keys(childData.specifications).forEach(key => {
      if (childData.specifications[key] === undefined) {
        delete childData.specifications[key];
      }
    });
    
    // Inherit GST details
    childData.hsnCode = this.hsnCode;
    childData.gstRate = this.gstRate;
    
      // Set inventory with quantity 1 for mixed bundles
      childData.inventory = {
        currentStock: this.bundle.bundleType === 'different_sizes_different_colors' ? 1 : variant.customQuantity,
        minStockLevel: this.inventory.minStockLevel,
        maxStockLevel: this.inventory.maxStockLevel,
        reorderPoint: this.inventory.reorderPoint,
        location: this.inventory.location
      };    // Copy other properties
    childData.description = `${this.description} - ${variant.size} ${variant.color}`;
    childData.tags = [...(this.tags || [])];
    childData.isActive = this.isActive;
    childData.isComboEligible = this.isComboEligible;
    
    const childProduct = new this.constructor(childData);
    await childProduct.save();
    childProducts.push(childProduct);
  }
  
  // Update parent product
  this.bundle.childrenCount = childProducts.length;
  this.inventory.currentStock = parentQuantity;
  
  // Set parent's specifications to include variant details
  if (config.sizes && config.sizes.length > 0 && config.colors && config.colors.length > 0) {
    const currentSpecs = this.specifications || {};
    
    // Determine parent variant based on bundle type
    let parentSize, parentColor;
    
    if (this.bundle.bundleType === 'same_size_different_colors') {
      parentSize = config.baseSize || config.sizes[0];
      parentColor = config.baseColor || config.colors[0];
    } else if (this.bundle.bundleType === 'different_sizes_same_color') {
      parentSize = config.baseSize || config.sizes[0];
      parentColor = config.baseColor || config.colors[0];
    } else {
      parentSize = config.sizes[0] || 'Standard';
      parentColor = config.colors[0] || 'Default';
    }
    
    this.specifications = {
      weight: currentSpecs.weight,
      material: currentSpecs.material,
      brand: currentSpecs.brand,
      model: currentSpecs.model,
      warrantyPeriod: currentSpecs.warrantyPeriod,
      size: parentSize,
      color: parentColor
    };
    
    // Add dimensions only if it exists and is not empty
    if (currentSpecs.dimensions && Object.keys(currentSpecs.dimensions).length > 0) {
      this.specifications.dimensions = currentSpecs.dimensions;
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
    .select('name code barcode inventory.currentStock pricing.offerPrice isActive');
  
  const totalStock = childProducts.reduce((sum, child) => sum + child.inventory.currentStock, 0);
  const totalValue = childProducts.reduce((sum, child) => 
    sum + (child.inventory.currentStock * child.pricing.offerPrice), 0);
  
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
      value: child.inventory.currentStock * child.pricing.offerPrice,
      isActive: child.isActive
    })),
    summary: {
      totalChildren: childProducts.length,
      expectedChildren: this.bundle.bundleSize - 1,
      isComplete: childProducts.length === (this.bundle.bundleSize - 1),
      totalStock: totalStock + this.inventory.currentStock,
      totalValue: totalValue + (this.inventory.currentStock * this.pricing.offerPrice),
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
  // For bundles, ensure bundleSize matches total inventory
  if (!bundleData.inventory?.currentStock || bundleData.inventory.currentStock < 2) {
    throw new Error('Bundle must have at least 2 total items (1 parent + 1 child)');
  }
  
  // Set bundle size based on total inventory if not already set
  if (!bundleData.bundle.bundleSize || bundleData.bundle.bundleSize !== bundleData.inventory.currentStock) {
    bundleData.bundle.bundleSize = bundleData.inventory.currentStock;
  }
  
  // Create parent product
  const parentData = {
    ...bundleData,
    type: 'parent',
    // Update parent name for mixed bundles
    name: bundleData.bundle.bundleType === 'different_sizes_different_colors' 
      ? `${bundleData.name} - Mixed Bundle`
      : bundleData.name,
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
  
  try {
    const parentProduct = new this(parentData);
    await parentProduct.save();
    
    // Auto-generate children if requested
    if (parentProduct.bundle.autoGenerateChildren) {
      await parentProduct.createChildProducts(userId);
    }
    
    return parentProduct;
  } catch (error) {
    console.error('Error creating parent product:', error);
    throw error;
  }
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
            $multiply: ['$inventory.currentStock', '$pricing.offerPrice']
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
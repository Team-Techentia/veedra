import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Play, Pause, Eye, BarChart3, Download, Upload, Printer } from 'lucide-react';
import comboService from '../../services/comboService';
import { toast } from 'react-hot-toast';

const CombosPage = () => {
  // State management
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingComboSku, setEditingComboSku] = useState(null);
  const [comboTypes, setComboTypes] = useState(['outfit', 'clearance', 'festive', 'family', 'kids', 'accessory', 'custom']);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Form states
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    type: 'outfit',
    // colorTag: 'Blue',
    validFrom: '',
    validTo: '',
    offerPrice: '',
    qtyProducts: '',
    notes: '',
    rules: {
      allowMix: true,
      minItems: 1,
      maxItems: 1,
      slots: []
    }
  });
  
  // Sticker states
  const [stickerConfig, setStickerConfig] = useState({
    size: 'M',
    showQR: 'none',
    copies: 1
  });
  
  const fileInputRef = useRef();

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const response = await comboService.getCombos();
      setCombos(response.data || response || []);
    } catch (error) {
      console.error('Error fetching combos:', error);
      toast.error('Failed to fetch combos');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const generateComboSku = () => {
    // Find the highest existing SKU number to avoid duplicates
    let maxNumber = 0;
    combos.forEach(combo => {
      if (combo.sku && combo.sku.startsWith('CMB-')) {
        const numberPart = parseInt(combo.sku.substring(4));
        if (!isNaN(numberPart) && numberPart > maxNumber) {
          maxNumber = numberPart;
        }
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `CMB-${nextNumber.toString().padStart(4, '0')}`;
  };

  const computeStatus = (combo) => {
    if (combo.paused) return 'paused';
    
    const today = new Date();
    const start = combo.validFrom ? new Date(combo.validFrom) : null;
    const end = combo.validTo ? new Date(combo.validTo) : null;
    
    if (start && today < start) return 'upcoming';
    if (end && today > end) return 'expired';
    
    return 'active';
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200',
      upcoming: 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200',
      expired: 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200',
      paused: 'px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 border border-orange-200'
    };
    return badges[status] || badges.active;
  };

  const computeSlotBands = (slots) => {
    let minMRP = 0, maxMRP = 0;
    for (const slot of slots) {
      minMRP += slot.minPrice || 0;
      maxMRP += slot.maxPrice || 0;
    }
    const minAt15 = Math.round(minMRP * 0.85);
    const maxAt15 = Math.round(maxMRP * 0.85);
    return { minMRP, maxMRP, minAt15, maxAt15, totalQty: slots.length };
  };

  // Form handlers
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Auto-generate slots when qtyProducts changes
    if (field === 'qtyProducts') {
      generateSlotsFromQty(value);
    }
  };

  const generateSlotsFromQty = (qty) => {
    const numSlots = Math.max(1, Math.floor(Number(qty) || 0));
    const newSlots = Array.from({ length: numSlots }, (_, i) => ({
      minPrice: '',
      maxPrice: ''
    }));
    
    setFormData(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        slots: newSlots,
        minItems: numSlots, // Always set to number of slots (1 item per slot)
        maxItems: numSlots  // Always set to number of slots (1 item per slot)
      }
    }));
  };

  const handleSlotChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        slots: prev.rules.slots.map((slot, i) => 
          i === index ? { ...slot, [field]: Number(value) || 0 } : slot
        )
      }
    }));
  };

  const addSlot = () => {
    setFormData(prev => {
      const newSlots = [...prev.rules.slots, { minPrice: '', maxPrice: '' }];
      return {
        ...prev,
        rules: {
          ...prev.rules,
          slots: newSlots,
          minItems: newSlots.length,
          maxItems: newSlots.length
        }
      };
    });
  };

  const removeSlot = (index) => {
    setFormData(prev => {
      const newSlots = prev.rules.slots.filter((_, i) => i !== index);
      return {
        ...prev,
        rules: {
          ...prev.rules,
          slots: newSlots,
          minItems: newSlots.length,
          maxItems: newSlots.length
        }
      };
    });
  };

  // CRUD operations
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Combo name is required');
      return false;
    }
    
    const offer = Number(formData.offerPrice) || 0;
    if (offer <= 0) {
      toast.error('Offer price must be greater than 0');
      return false;
    }
    
    if (formData.rules.slots.length === 0) {
      toast.error('At least one price slot is required');
      return false;
    }
    
    for (const slot of formData.rules.slots) {
      if (!slot.minPrice || !slot.maxPrice) {
        toast.error('All slots must have min and max prices');
        return false;
      }
      if (Number(slot.minPrice) > Number(slot.maxPrice)) {
        toast.error('Min price cannot be greater than max price');
        return false;
      }
    }
    
    return true;
  };

  const saveCombo = async () => {
    if (!validateForm()) return;
    
    try {

      
      const payload = {
        ...formData,
        offerPrice: Number(formData.offerPrice),
        qtyProducts: Number(formData.qtyProducts) || formData.rules.slots.length,
        rules: {
          ...formData.rules,
          minItems: Number(formData.rules.minItems) || formData.rules.slots.length,
          maxItems: Number(formData.rules.maxItems) || formData.rules.slots.length,
          slots: formData.rules.slots.map(slot => ({
            minPrice: Number(slot.minPrice),
            maxPrice: Number(slot.maxPrice)
          }))
        }
      };

      // Only include SKU if user manually entered one, otherwise let backend generate it
      if (formData.sku && formData.sku.trim()) {
        payload.sku = formData.sku.trim();
      }

      if (editingComboSku) {
        const combo = combos.find(c => c.sku === editingComboSku);
        await comboService.updateCombo(combo._id, payload);
        toast.success('Combo updated successfully');
      } else {
        await comboService.createCombo(payload);
        toast.success('Combo created successfully');
      }
      
      resetForm();
      fetchCombos();
    } catch (error) {
      console.error('Error saving combo:', error);
      toast.error('Failed to save combo');
    }
  };

  const editCombo = (combo) => {
    setEditingComboSku(combo.sku);
    setFormData({
      sku: combo.sku || '',
      name: combo.name || '',
      type: combo.type || 'outfit',
      colorTag: combo.colorTag || 'Blue',
      validFrom: combo.validFrom ? new Date(combo.validFrom).toISOString().split('T')[0] : '',
      validTo: combo.validTo ? new Date(combo.validTo).toISOString().split('T')[0] : '',
      offerPrice: combo.offerPrice || '',
      qtyProducts: combo.qtyProducts || combo.rules?.slots?.length || '',
      notes: combo.notes || '',
      rules: {
        allowMix: combo.rules?.allowMix !== false,
        minItems: combo.rules?.minItems || '',
        maxItems: combo.rules?.maxItems || '',
        slots: combo.rules?.slots || []
      }
    });
  };

  const deleteCombo = async (combo) => {
    if (!window.confirm(`Delete combo "${combo.name}"?`)) return;
    
    try {
      await comboService.deleteCombo(combo._id);
      toast.success('Combo deleted successfully');
      fetchCombos();
    } catch (error) {
      console.error('Error deleting combo:', error);
      toast.error('Failed to delete combo');
    }
  };

  const togglePause = async (combo) => {
    try {
      await comboService.updateCombo(combo._id, { ...combo, paused: !combo.paused });
      toast.success(`Combo ${combo.paused ? 'resumed' : 'paused'} successfully`);
      fetchCombos();
    } catch (error) {
      console.error('Error updating combo:', error);
      toast.error('Failed to update combo');
    }
  };

  const resetForm = () => {
    setEditingComboSku(null);
    setFormData({
      sku: '',
      name: '',
      type: 'outfit',
      // colorTag: 'Blue',
      validFrom: '',
      validTo: '',
      offerPrice: '',
      qtyProducts: '',
      notes: '',
      rules: {
        allowMix: true,
        minItems: 1,
        maxItems: 1,
        slots: []
      }
    });
  };

  // Export/Import functions
  const exportCombos = () => {
    const dataStr = JSON.stringify(combos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `combos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCombos = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          setCombos(importedData);
          toast.success(`Imported ${importedData.length} combos successfully`);
        }
      } catch (error) {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  // Sticker functions
  const renderStickerPreview = () => {
    if (!formData.name || !formData.offerPrice) {
      return <div className="text-gray-500 text-center">Configure your combo to preview the sticker…</div>;
    }

    const slotList = formData.rules.slots.map(s => `₹${s.minPrice}–${s.maxPrice}`).join(' | ');
    // Use pixels for preview (3in = ~288px, 2in = ~192px at 96dpi)
    const stickerWidth = '320px'; // Better for preview display
    const stickerHeight = '220px'; // Better for preview display

    // Color mapping for background
    const colorMap = { 
      Blue: "#dbeafe", 
      Green: "#dcfce7", 
      Orange: "#ffedd5", 
      Pink: "#fde2e8", 
      Yellow: "#fef9c3", 
      Purple: "#ede9fe", 
      Red: "#fee2e2" 
    };
    const backgroundColor = "#ffffff";

    return (
      <div 
        style={{
          width: stickerWidth,
          height: stickerHeight,
          border: '2px solid #000',
          background: backgroundColor,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.3',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div 
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            paddingBottom: '6px',
            marginBottom: '8px',
            fontSize: '18px'
          }}
        >
          VEEDRA THE BRAND
        </div>
        
        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 'bold', minWidth: '50px', fontSize: '14px' }}>Name:</span>
            <div style={{ 
              flex: 1, 
              minHeight: '18px',
              paddingLeft: '4px',
              fontSize: '14px'
            }}>
              {formData.name || ''}
            </div>
          </div>
          
          {/* SKU */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 'bold', minWidth: '50px', fontSize: '14px' }}>SKU:</span>
            <span style={{ fontSize: '14px' }}>{formData.sku.trim() || generateComboSku()}</span>
          </div>
          
          {/* Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 'bold', minWidth: '50px', fontSize: '14px' }}>Type:</span>
            <div style={{ 
              flex: 1, 
              minHeight: '18px',
              paddingLeft: '4px',
              fontSize: '14px'
            }}>
              {formData.type || ''}
            </div>
          </div>
          
          {/* Spacer */}
          <div style={{ margin: '8px 0' }}></div>
          
          {/* Price Information */}
          <div style={{ fontSize: '12px' }}>
            <div style={{ marginBottom: '6px' }}>
              <strong>Price Slots:</strong> {slotList || '₹350–400 | ₹430–500'}
            </div>
            <div style={{ 
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: 'center',
              background: '#f59e0b',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              marginTop: '4px'
            }}>
              ₹{formData.offerPrice}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // For print (returns HTML string)
 const renderStickerHTML = () => {
  if (!formData.name || !formData.offerPrice) {
    return '<div>Configure your combo first</div>';
  }

  const slotList = formData.rules.slots.map(s => `₹${s.minPrice}–${s.maxPrice}`).join(' | ');
  
  // Color mapping for background
  const colorMap = { 
    Blue: "#dbeafe", 
    Green: "#dcfce7", 
    Orange: "#ffedd5", 
    Pink: "#fde2e8", 
    Yellow: "#fef9c3", 
    Purple: "#ede9fe", 
    Red: "#fee2e2" 
  };
  const backgroundColor = "#ffffff";
  
  return `
    <div style="
      width: 75mm; 
      height: 50mm; 
      padding: 3mm; 
      border: 2px solid #000; 
      background: ${backgroundColor}; 
      box-sizing: border-box; 
      display: flex; 
      flex-direction: column;
      font-family: Arial, sans-serif;
    ">
      <!-- Header -->
      <div style="
        font-size: 14px; 
        font-weight: bold; 
        text-align: center; 
        margin-bottom: 3mm;
        border-bottom: 1px solid #666;
        padding-bottom: 2mm;
      ">VEEDRA THE BRAND</div>
      
      <!-- Content -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 1.5mm;">
        <!-- Name -->
        <div style="display: flex; font-size: 11px;">
          <span style="font-weight: bold; min-width: 35mm;">Name:</span>
          <span style="flex: 1;">${formData.name || ''}</span>
        </div>
        
        <!-- SKU -->
        <div style="display: flex; font-size: 11px;">
          <span style="font-weight: bold; min-width: 35mm;">SKU:</span>
          <span>${formData.sku.trim() || generateComboSku()}</span>
        </div>
        
        <!-- Type -->
        <div style="display: flex; font-size: 11px;">
          <span style="font-weight: bold; min-width: 35mm;">Type:</span>
          <span style="text-transform: capitalize;">${formData.type || ''}</span>
        </div>
        
        <!-- Price Slots -->
        <div style="margin-top: 2mm; padding-top: 2mm; border-top: 1px solid #999;">
          <div style="font-size: 10px; margin-bottom: 2mm;">
            <strong>Price Slots:</strong> ${slotList || '₹350–400 | ₹570–700'}
          </div>
          
          <!-- Offer Price - Highlighted -->
          <div style="
           
            color: black;
            padding: 2mm 3mm;
            border-radius: 2mm;
            text-align: center;
            margin-top: 7mm;
            font-size: 16px;
            font-weight: bold;
           
          ">
            Combo Offer: ₹${formData.offerPrice}
          </div>
        </div>
      </div>
    </div>
  `;
};

const printSticker = () => {
  const copies = Math.max(1, Number(stickerConfig.copies));
  const w = window.open("", "_blank");
  if (!w) {
    toast.error('Please allow popups to print stickers');
    return;
  }
  
  const stickerHTML = renderStickerHTML();
  const repeated = Array.from({ length: copies }).map(() => stickerHTML).join("");
  
  w.document.write(`
    <html>
      <head>
        <title>Print Combo Stickers</title>
        <style>
          @page { 
            size: 75mm 50mm; 
            margin: 0; 
          }
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 0;
          }
          .sticker-page {
            width: 75mm;
            height: 50mm;
            page-break-after: always;
            break-after: page;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>${repeated}</body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
  w.close();
};

  // Filter combos
  const filteredCombos = combos.filter(combo => {
    const matchesSearch = combo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         combo.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const status = computeStatus(combo);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesType = typeFilter === 'all' || combo.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🛍️ Combo Manager</h1>
          <p className="text-blue-100">Create and manage product combos with price slots</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg p-4 shadow mb-6">
            <h2 className="font-semibold text-blue-600 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={resetForm}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                New Combo
              </button>
              <button
                onClick={exportCombos}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Combos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importCombos}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Combos
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <h2 className="font-semibold text-blue-600 mb-4">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Name or SKU"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="expired">Expired</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Combo Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  {comboTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Combos Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Combos List</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Combo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCombos.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                          ? 'No combos match your search criteria'
                          : 'No combos found. Create your first combo to get started.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCombos.map((combo) => {
                      const status = computeStatus(combo);
                      
                      return (
                        <tr key={combo._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input type="checkbox" className="rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{combo.name}</div>
                            <div className="text-sm text-gray-500">{combo.notes}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm">{combo.sku}</td>
                          <td className="px-4 py-3 capitalize">{combo.type}</td>
                          <td className="px-4 py-3 text-sm">
                            <div>{combo.validFrom ? new Date(combo.validFrom).toLocaleDateString() : 'N/A'}</div>
                            <div>{combo.validTo ? new Date(combo.validTo).toLocaleDateString() : 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(combo.offerPrice)}</td>
                          <td className="px-4 py-3">
                            <span className={getStatusBadge(status)}>{status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editCombo(combo)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => togglePause(combo)}
                                className={`p-1 ${combo.paused ? 'text-green-600 hover:text-green-800' : 'text-yellow-600 hover:text-yellow-800'}`}
                                title={combo.paused ? 'Resume' : 'Pause'}
                              >
                                {combo.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => deleteCombo(combo)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Combo Builder Form */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Create / Edit Combo</h2>
            </div>
            <form className="p-4 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Combo Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Premium Weekend Combo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Combo SKU</label>
                  <input
                    type="text"
                    placeholder="CMB-0001"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <small className="text-gray-500">Auto-generated if left blank</small>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Combo Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {comboTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validity & Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => handleInputChange('validFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid To</label>
                  <input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => handleInputChange('validTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Offer Price (Combo) *</label>
                  <input
                    type="number"
                    placeholder="e.g., 1699"
                    min="0"
                    value={formData.offerPrice}
                    onChange={(e) => handleInputChange('offerPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Qty of Products</label>
                  <input
                    type="number"
                    placeholder="e.g., 3"
                    min="1"
                    value={formData.qtyProducts}
                    onChange={(e) => handleInputChange('qtyProducts', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => generateSlotsFromQty(formData.qtyProducts)}
                    className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Generate Slots
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  rows="2"
                  placeholder="Any special terms to show on the sticker..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Rules & Slots */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Combo Slot Rules</h2>
              <p className="text-sm text-gray-600">Slots are auto-generated based on Qty of Products.</p>
            </div>
            <div className="p-4 space-y-6">
              {/* Rules Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Allow Mix & Match</label>
                  <select
                    value={formData.rules.allowMix ? 'yes' : 'no'}
                    onChange={(e) => handleInputChange('rules.allowMix', e.target.value === 'yes')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Items Required</label>
                  <input
                    type="number"
                    value={1}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <small className="text-gray-500">Fixed at 1 item per slot</small>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Items Allowed</label>
                  <input
                    type="number"
                    value={1}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <small className="text-gray-500">Fixed at 1 item per slot</small>
                </div>
              </div>

              {/* Price Slots */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Price Slots</h3>
                  <button
                    type="button"
                    onClick={addSlot}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Add Slot
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.rules.slots.map((slot, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-blue-600">Slot {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeSlot(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Min Price</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g., 300"
                            value={slot.minPrice}
                            onChange={(e) => handleSlotChange(index, 'minPrice', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Max Price</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g., 399"
                            value={slot.maxPrice}
                            onChange={(e) => handleSlotChange(index, 'maxPrice', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Offer</div>
                    <div className="font-semibold">{formatCurrency(formData.offerPrice)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Items</div>
                    <div className="font-semibold">{formData.rules.slots.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="font-semibold text-green-600">Active</div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={saveCombo}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  {editingComboSku ? 'Update Combo' : 'Save Combo'}
                </button>
                {editingComboSku && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="ml-4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sticker Preview */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Sticker Preview</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 min-h-40 flex items-center justify-center">
                {renderStickerPreview()}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sticker Size</label>
                  <select
                    value={stickerConfig.size}
                    onChange={(e) => setStickerConfig(prev => ({...prev, size: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="S">Small</option>
                    <option value="M">Medium</option>
                    <option value="L">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">QR/Barcode</label>
                  <select
                    value={stickerConfig.showQR}
                    onChange={(e) => setStickerConfig(prev => ({...prev, showQR: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="qr">QR Code</option>
                    <option value="barcode">Barcode</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={stickerConfig.copies}
                    onChange={(e) => setStickerConfig(prev => ({...prev, copies: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={printSticker}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Sticker
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CombosPage;
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, ArrowRight, Plus, X, Camera, Upload, MapPin, Save, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import vendorService from '../../services/vendorService';
import categoryService from '../../services/categoryService';

const AddVendorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Multi-step form state
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    code: '',
    city: '',
    hasFactory: 'no',
    factoryLocation: '',
    factoryDistance: '',
    dob: '',
    age: '',
    stitchMachines: '',
    productionPerDay: '',
    variationType: '1_size_diff_colors',
    minOrderQuantity: '',
    canReplaceUnsold: 'no',
    
    // Contact Details
    ownerName: '',
    ownerMobile: '',
    orderPerson1: '',
    orderMobile1: '',
    orderPerson2: '',
    orderMobile2: '',
    email: '',
    
    // Tax & Compliance
    gstNumber: '',
    panNumber: '',
    
    // Categories & Specialties
    specialties: [], // Array of {category, prices}
    categories: [], // Array of category names
    rating: '⭐️',
    
    // Performance & Notes
    performanceScore: 0,
    notes: '',
    
    // Location
    location: '',
    latitude: '',
    longitude: '',
    
    // Images
    shopImages: [],
    
    // System
    isActive: true
  });

  // Temporary states for category pricing
  const [tempCategory, setTempCategory] = useState('');
  const [tempPrices, setTempPrices] = useState([]);
  const [tempPrice, setTempPrice] = useState('');

  // Location state
  const [locationStatus, setLocationStatus] = useState('');
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Image capture modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageCount, setImageCount] = useState('');

  // Multi-select categories
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
    if (id) {
      loadVendor();
    }
    startLocationTracking();
    
    return () => {
      if (locationWatcher) {
        navigator.geolocation.clearWatch(locationWatcher);
      }
    };
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      // Filter out subcategories, only show main categories (no parent)
      const mainCategories = data.filter(cat => !cat.parent || cat.parent === null);
      setCategories(mainCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadVendor = async () => {
    try {
      setLoading(true);
      const vendor = await vendorService.getVendor(id);
      setFormData({
        ...vendor,
        dob: vendor.dob ? new Date(vendor.dob).toISOString().split('T')[0] : '',
        specialties: vendor.specialties || [],
        categories: vendor.categories || [],
        shopImages: vendor.shopImages || []
      });
      setSelectedCategories(new Set(vendor.categories || []));
    } catch (error) {
      console.error('Error loading vendor:', error);
      toast.error('Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported');
      return;
    }

    setLocationStatus('📡 Getting location...');
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ latitude, longitude, accuracy });
        
        let accuracyColor = '🔴';
        if (accuracy <= 10) accuracyColor = '🟢';
        else if (accuracy <= 50) accuracyColor = '🟡';
        
        setLocationStatus(
          `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}, ${accuracyColor} ±${accuracy.toFixed(2)}m`
        );
      },
      (error) => {
        setLocationStatus('❌ Location unavailable');
        console.error('Location error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    
    setLocationWatcher(watchId);
  };

  const addCurrentLocation = () => {
    if (!currentLocation) {
      toast.error('Location not available');
      return;
    }

    const { latitude, longitude, accuracy } = currentLocation;
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    
    setFormData(prev => ({
      ...prev,
      location: `${mapsUrl} — Accuracy: ${accuracy.toFixed(2)} meters`,
      latitude: latitude.toString(),
      longitude: longitude.toString()
    }));

    toast.success('Location added successfully!');
  };

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age.toString();
  };

  const generateVendorCode = (name, city) => {
    if (!name || !city) return '';
    
    const namePart = name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const cityPart = city.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `V${namePart}${cityPart}${timestamp}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
        ...(field === 'dob' ? { age: calculateAge(value) } : {})
      };

      // Auto-generate code when name or city changes
      if ((field === 'name' || field === 'city') && !id) {
        const name = field === 'name' ? value : prev.name;
        const city = field === 'city' ? value : prev.city;
        if (name && city) {
          newData.code = generateVendorCode(name, city);
        }
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addPrice = () => {
    if (!tempPrice || parseInt(tempPrice) <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    setTempPrices(prev => [...prev, parseInt(tempPrice)]);
    setTempPrice('');
  };

  const removePrice = (index) => {
    setTempPrices(prev => prev.filter((_, i) => i !== index));
  };

  const saveCategoryPrice = () => {
    if (!tempCategory) {
      toast.error('Select a category');
      return;
    }
    if (tempPrices.length === 0) {
      toast.error('Add at least one price');
      return;
    }

    const newSpecialty = { category: tempCategory, prices: [...tempPrices] };
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, newSpecialty]
    }));

    // Reset temp states
    setTempCategory('');
    setTempPrices([]);
    toast.success('Category price added');
  };

  const removeSpecialty = (index) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  const toggleCategory = (categoryName) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedCategories(newSelected);
    setFormData(prev => ({
      ...prev,
      categories: Array.from(newSelected)
    }));
  };

  const captureImages = async (count) => {
    const newImages = [];
    let locationText = '';
    
    if (currentLocation) {
      const { latitude, longitude, accuracy } = currentLocation;
      locationText = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}, ±${accuracy.toFixed(2)}m`;
    }

    for (let i = 1; i <= count; i++) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        // Create video element
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Wait for video to load
        await new Promise(resolve => {
          video.onloadedmetadata = resolve;
        });

        // Create canvas and capture
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Add location watermark if available
        if (locationText) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(10, canvas.height - 60, 400, 50);
          ctx.fillStyle = 'white';
          ctx.font = '14px Arial';
          ctx.fillText(locationText, 15, canvas.height - 35);
          ctx.fillText(new Date().toLocaleString(), 15, canvas.height - 15);
        }

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        newImages.push(imageData);

        // Stop stream
        stream.getTracks().forEach(track => track.stop());
        
        if (i < count) {
          await new Promise(resolve => {
            toast.success(`Image ${i} captured. Prepare for image ${i + 1}`);
            setTimeout(resolve, 2000);
          });
        }
      } catch (error) {
        console.error('Error capturing image:', error);
        toast.error(`Failed to capture image ${i}`);
        break;
      }
    }

    setFormData(prev => ({
      ...prev,
      shopImages: [...prev.shopImages, ...newImages]
    }));
    
    toast.success(`${newImages.length} images captured successfully`);
  };

  const uploadImages = (event) => {
    const files = Array.from(event.target.files);
    
    Promise.all(files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    })).then(images => {
      setFormData(prev => ({
        ...prev,
        shopImages: [...prev.shopImages, ...images]
      }));
      toast.success(`${images.length} images uploaded`);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      shopImages: prev.shopImages.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Shop name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!formData.ownerMobile.match(/^[6-9]\d{9}$/)) newErrors.ownerMobile = 'Valid mobile number required';
    if (!formData.orderPerson1.trim()) newErrors.orderPerson1 = 'Order person name is required';
    if (!formData.orderMobile1.match(/^[6-9]\d{9}$/)) newErrors.orderMobile1 = 'Valid mobile number required';
    if (formData.email && !formData.email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      newErrors.email = 'Valid email required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        dob: formData.dob ? new Date(formData.dob) : null,
        age: parseInt(formData.age) || null,
        stitchMachines: parseInt(formData.stitchMachines) || null,
        productionPerDay: parseInt(formData.productionPerDay) || null,
        minOrderQuantity: parseInt(formData.minOrderQuantity) || null,
        performanceScore: parseInt(formData.performanceScore) || 0,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
        // Ensure enum fields have proper values
        variationType: formData.variationType || '1_size_diff_colors',
        canReplaceUnsold: formData.canReplaceUnsold || 'no',
        hasFactory: formData.hasFactory || 'no',
        rating: formData.rating || '⭐️'
      };

      if (id) {
        await vendorService.updateVendor(id, submitData);
        toast.success('Vendor updated successfully');
      } else {
        await vendorService.createVendor(submitData);
        toast.success('Vendor created successfully');
      }
      
      navigate('/vendors');
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error('Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    setCurrentStep(2);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep(1);
    window.scrollTo(0, 0);
  };

  if (loading && id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Vendor' : 'Add New Vendor'}
          </h1>
          <p className="text-gray-600 mt-2">
            Step {currentStep} of 2: {currentStep === 1 ? 'Basic Information' : 'Additional Details'}
          </p>
        </div>
        <button
          onClick={() => navigate('/vendors')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </button>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter shop name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Auto-generated"
                    readOnly={!id} // Only allow editing when updating existing vendor
                  />
                  <p className="text-gray-500 text-xs mt-1">Auto-generated from shop name and city</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Has Factory?
                  </label>
                  <select
                    value={formData.hasFactory}
                    onChange={(e) => handleInputChange('hasFactory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Factory Location
                  </label>
                  <input
                    type="text"
                    value={formData.factoryLocation}
                    onChange={(e) => handleInputChange('factoryLocation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Factory address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distance from shop (km)
                  </label>
                  <input
                    type="text"
                    value={formData.factoryDistance}
                    onChange={(e) => handleInputChange('factoryDistance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter distance"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Present Stitching Machines
                  </label>
                  <input
                    type="number"
                    value={formData.stitchMachines}
                    onChange={(e) => handleInputChange('stitchMachines', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Production Pieces per Day
                  </label>
                  <input
                    type="number"
                    value={formData.productionPerDay}
                    onChange={(e) => handleInputChange('productionPerDay', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. 300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Variation Type
                  </label>
                  <select
                    value={formData.variationType}
                    onChange={(e) => handleInputChange('variationType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Variation Type --</option>
                    <option value="1_size_diff_colors">1 Size - Different Colors</option>
                    <option value="diff_sizes_1_color">Different Sizes - 1 Color</option>
                    <option value="both_size_and_color">Both Sizes and Colors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderQuantity}
                    onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. 50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exchange/Replace Unsold Items?
                  </label>
                  <select
                    value={formData.canReplaceUnsold}
                    onChange={(e) => handleInputChange('canReplaceUnsold', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select --</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.ownerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter owner name"
                  />
                  {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.ownerMobile}
                    onChange={(e) => handleInputChange('ownerMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.ownerMobile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter mobile number"
                    maxLength={10}
                  />
                  {errors.ownerMobile && <p className="text-red-500 text-sm mt-1">{errors.ownerMobile}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Taking Person Name 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.orderPerson1}
                    onChange={(e) => handleInputChange('orderPerson1', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.orderPerson1 ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter person name"
                  />
                  {errors.orderPerson1 && <p className="text-red-500 text-sm mt-1">{errors.orderPerson1}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.orderMobile1}
                    onChange={(e) => handleInputChange('orderMobile1', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.orderMobile1 ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter mobile number"
                    maxLength={10}
                  />
                  {errors.orderMobile1 && <p className="text-red-500 text-sm mt-1">{errors.orderMobile1}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Taking Person Name 2
                  </label>
                  <input
                    type="text"
                    value={formData.orderPerson2}
                    onChange={(e) => handleInputChange('orderPerson2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number 2
                  </label>
                  <input
                    type="tel"
                    value={formData.orderMobile2}
                    onChange={(e) => handleInputChange('orderMobile2', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter mobile number"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@domain.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Tax & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Tax & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter GST number"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter PAN number"
                    maxLength={10}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <button
              onClick={nextStep}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Additional Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Category Prices */}
          <Card>
            <CardHeader>
              <CardTitle>Category Prices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Category
                  </label>
                  <select
                    value={tempCategory}
                    onChange={(e) => setTempCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. 150"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={addPrice}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Price
                  </button>
                </div>
              </div>

              {tempPrices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700">Prices: </span>
                  {tempPrices.map((price, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                    >
                      ₹{price}
                      <button
                        onClick={() => removePrice(index)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={saveCategoryPrice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Category
              </button>

              {formData.specialties.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Category Specialties</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left border-b">Category</th>
                          <th className="px-4 py-2 text-left border-b">Prices (₹)</th>
                          <th className="px-4 py-2 text-left border-b">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.specialties.map((specialty, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 border-b">{specialty.category}</td>
                            <td className="px-4 py-2 border-b">{specialty.prices.join(', ')}</td>
                            <td className="px-4 py-2 border-b">
                              <button
                                onClick={() => removeSpecialty(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best in Category */}
          <Card>
            <CardHeader>
              <CardTitle>Best in Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Categories
                </label>
                <div
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer flex justify-between items-center"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <span className="text-gray-700">
                    {selectedCategories.size > 0 
                      ? Array.from(selectedCategories).join(', ') 
                      : 'Select Categories'
                    }
                  </span>
                  <span className="text-gray-400">▼</span>
                </div>
                
                {showCategoryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {categories.map(cat => (
                      <label
                        key={cat._id}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(cat.name)}
                          onChange={() => toggleCategory(cat.name)}
                          className="mr-2"
                        />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) => handleInputChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="⭐️">⭐️</option>
                  <option value="⭐️⭐️">⭐️⭐️</option>
                  <option value="⭐️⭐️⭐️">⭐️⭐️⭐️</option>
                  <option value="⭐️⭐️⭐️⭐️">⭐️⭐️⭐️⭐️</option>
                  <option value="⭐️⭐️⭐️⭐️⭐️">⭐️⭐️⭐️⭐️⭐️</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Performance & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Performance & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performance Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.performanceScore}
                  onChange={(e) => handleInputChange('performanceScore', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 75"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Shop Images */}
          <Card>
            <CardHeader>
              <CardTitle>Shop Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowImageModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Shop Images
                </button>

                <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload from Computer
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={uploadImages}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.shopImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.shopImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Shop ${index + 1}`}
                        className="w-full h-32 object-cover border rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Location */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  placeholder="Location will appear here"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startLocationTracking}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📡 Fetch Current Location
                </button>

                <button
                  onClick={addCurrentLocation}
                  disabled={!currentLocation}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentLocation 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Add Current Location
                </button>
              </div>

              {locationStatus && (
                <p className="text-sm text-gray-600">{locationStatus}</p>
              )}

              {currentLocation && (
                <div className="mt-4">
                  <iframe
                    src={`https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}&output=embed`}
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: '8px' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/vendors')}
                className="flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {id ? 'Update Vendor' : 'Save Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Capture Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-medium mb-4">How many images do you want to capture?</h3>
            <input
              type="number"
              min="1"
              value={imageCount}
              onChange={(e) => setImageCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="Enter number"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const count = parseInt(imageCount);
                  if (count > 0) {
                    setShowImageModal(false);
                    captureImages(count);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVendorPage;
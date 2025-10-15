import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import vendorService from '../../services/vendorService';

const AddVendorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    ownerName: '',
    ownerMobile: '',
    orderPerson1: '',
    orderMobile1: '',
    gstNumber: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      loadVendor();
    }
  }, [id]);

  const loadVendor = async () => {
    try {
      setLoading(true);
      const vendor = await vendorService.getVendor(id);
      setFormData({
        name: vendor.name || '',
        code: vendor.code || '',
        city: vendor.city || '',
        ownerName: vendor.ownerName || '',
        ownerMobile: vendor.ownerMobile || '',
        orderPerson1: vendor.orderPerson1 || '',
        orderMobile1: vendor.orderMobile1 || '',
        gstNumber: vendor.gstNumber || '',
        isActive: vendor.isActive !== undefined ? vendor.isActive : true
      });
    } catch (error) {
      console.error('Error loading vendor:', error);
      toast.error('Failed to load vendor');
    } finally {
      setLoading(false);
    }
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
      const newData = { ...prev, [field]: value };

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Shop name is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    
    if (!formData.ownerMobile.match(/^[6-9]\d{9}$/)) {
      newErrors.ownerMobile = 'Valid 10-digit mobile number required';
    }
    
    if (!formData.orderPerson1.trim()) {
      newErrors.orderPerson1 = 'Order person name is required';
    }
    
    if (!formData.orderMobile1.match(/^[6-9]\d{9}$/)) {
      newErrors.orderMobile1 = 'Valid 10-digit mobile number required';
    }
    
    if (!formData.gstNumber.trim()) {
      newErrors.gstNumber = 'GST number is required';
    } else if (!formData.gstNumber.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)) {
      newErrors.gstNumber = 'Valid GST number required (e.g., 22AAAAA0000A1Z5)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setLoading(true);
      
      if (id) {
        await vendorService.updateVendor(id, formData);
        toast.success('Vendor updated successfully');
      } else {
        await vendorService.createVendor(formData);
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

  if (loading && id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {id ? 'Edit Vendor' : 'Add New Vendor'}
        </h1>
        <button
          onClick={() => navigate('/vendors')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
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
                  readOnly={!id}
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
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
                {errors.ownerMobile && <p className="text-red-500 text-sm mt-1">{errors.ownerMobile}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.orderPerson1}
                  onChange={(e) => handleInputChange('orderPerson1', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.orderPerson1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter order person name"
                />
                {errors.orderPerson1 && <p className="text-red-500 text-sm mt-1">{errors.orderPerson1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Person Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.orderMobile1}
                  onChange={(e) => handleInputChange('orderMobile1', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.orderMobile1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
                {errors.orderMobile1 && <p className="text-red-500 text-sm mt-1">{errors.orderMobile1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.gstNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter GST number (e.g., 22AAAAA0000A1Z5)"
                  maxLength={15}
                />
                {errors.gstNumber && <p className="text-red-500 text-sm mt-1">{errors.gstNumber}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/vendors')}
            className="flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </button>

          <button
            type="submit"
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
      </form>
    </div>
  );
};

export default AddVendorPage;
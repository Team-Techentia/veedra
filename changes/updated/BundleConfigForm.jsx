import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';

export const BundleConfigForm = ({
  formData,
  setFormData,
  errors,
  touched,
  setFieldValue,
  setFieldTouched
}) => {
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    
    // For mixed bundles, enforce exactly 50 items
    if (formData.bundleType === 'different_sizes_different_colors' && value !== 50) {
      setFieldValue('quantity', 50); // Force quantity to 50
      return;
    }
    
    setFieldValue('quantity', value);
  };

  return (
    <div className="space-y-4">
      {/* Bundle Type Selection */}
      <div>
        <Label htmlFor="bundleType">Bundle Type</Label>
        <Select
          id="bundleType"
          name="bundleType"
          value={formData.bundleType}
          onChange={(e) => {
            const value = e.target.value;
            setFieldValue('bundleType', value);
            
            // Reset and set quantity to 50 for mixed bundles
            if (value === 'different_sizes_different_colors') {
              setFieldValue('quantity', 50);
            }
          }}
          onBlur={() => setFieldTouched('bundleType', true)}
          error={touched.bundleType && errors.bundleType}
        >
          <option value="">Select Bundle Type</option>
          <option value="same_size_different_colors">Same Size, Different Colors</option>
          <option value="different_sizes_same_color">Different Sizes, Same Color</option>
          <option value="different_sizes_different_colors">Mixed Size & Color (1+49)</option>
        </Select>
        {touched.bundleType && errors.bundleType && (
          <p className="text-sm text-red-500">{errors.bundleType}</p>
        )}
      </div>

      {/* Quantity Field */}
      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          type="number"
          id="quantity"
          name="quantity"
          value={formData.quantity}
          onChange={handleQuantityChange}
          onBlur={() => setFieldTouched('quantity', true)}
          min={formData.bundleType === 'different_sizes_different_colors' ? 50 : 1}
          max={formData.bundleType === 'different_sizes_different_colors' ? 50 : 100}
          disabled={formData.bundleType === 'different_sizes_different_colors'} // Lock quantity for mixed bundles
          error={touched.quantity && errors.quantity}
        />
        {formData.bundleType === 'different_sizes_different_colors' && (
          <p className="text-sm text-muted">Mixed bundles are fixed at 50 items (1 parent + 49 child)</p>
        )}
        {touched.quantity && errors.quantity && (
          <p className="text-sm text-red-500">{errors.quantity}</p>
        )}
      </div>
    </div>
  );
};
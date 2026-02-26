import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import toast from 'react-hot-toast';

const DeliveryLabelPage = () => {
    const [formData, setFormData] = useState({
        mobile: '',
        customerName: '',
        address: '',
        pincode: '',
        orderId: '',
        paymentMode: 'Prepaid',
        weight: ''
    });
    const [lookingUp, setLookingUp] = useState(false);

    // Auto-lookup customer name when 10 digits are entered
    useEffect(() => {
        const fetchCustomerName = async () => {
            if (formData.mobile.length !== 10) return;
            setLookingUp(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/wallets/phone/${formData.mobile}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const name = data?.data?.customerName;
                    if (name && name !== 'Customer') {
                        setFormData(prev => ({ ...prev, customerName: name }));
                        toast.success(`Customer found: ${name}`);
                    }
                }
            } catch (err) {
                console.error('Lookup error:', err);
            } finally {
                setLookingUp(false);
            }
        };
        fetchCustomerName();
    }, [formData.mobile]);

    const paymentModes = ['Prepaid', 'COD', 'Online'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePrintLabel = () => {
        // Validate required fields
        if (!formData.mobile || formData.mobile.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }
        if (!formData.customerName.trim()) {
            toast.error('Please enter customer name');
            return;
        }
        if (!formData.address.trim()) {
            toast.error('Please enter address');
            return;
        }
        if (!formData.pincode || formData.pincode.length !== 6) {
            toast.error('Please enter a valid 6-digit pincode');
            return;
        }

        const printWindow = window.open('', '_blank');
        const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Label</title>
        <style>
          @media print {
            @page {
              margin: 0;
              size: 80mm auto;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 10px;
            margin: 0;
            max-width: 300px;
            box-sizing: border-box;
          }
          .container {
            border: 2px dashed #000;
            padding: 15px;
            min-height: 400px;
          }
          .header {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            text-decoration: underline;
            margin-bottom: 8px;
          }
          .info {
            font-size: 13px;
            line-height: 1.5;
          }
          .bold {
            font-weight: bold;
          }
          .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 12px;
            border-top: 1px dotted #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Delivery Label</div>
          
          <div class="section">
            <div class="section-title">TO:</div>
            <div class="info">
              <div class="bold">${formData.customerName}</div>
              <div>${formData.address}</div>
              <div>Pincode: ${formData.pincode}</div>
              <div>Mobile: ${formData.mobile}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">FROM:</div>
            <div class="info">
              <div class="bold">VEEDRA THE BRAND</div>
              <div>1st Parallel Road,</div>
              <div>Durigudi, Shimoga -</div>
              <div>577201</div>
              <div>Mb : 7026209627</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">ORDER INFO:</div>
            <div class="info">
              ${formData.orderId ? `<div>Order ID: ${formData.orderId}</div>` : ''}
              <div>Payment: ${formData.paymentMode.toUpperCase()}</div>
              ${formData.weight ? `<div>Weight: ${formData.weight} g</div>` : ''}
            </div>
          </div>

          <div class="footer">
            Thank you for shopping with<br>VEEDRA THE BRAND!
          </div>
        </div>
      </body>
      </html>
    `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Delivery Label Generator</CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    {/* Mobile Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mobile Number
                        </label>
                        <input
                            type="tel"
                            name="mobile"
                            maxLength="10"
                            value={formData.mobile}
                            onChange={(e) => handleInputChange({
                                target: {
                                    name: 'mobile',
                                    value: e.target.value.replace(/\D/g, '')
                                }
                            })}
                            placeholder="10-digit Mobile No"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Customer Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Name {lookingUp && <span className="text-xs text-blue-500 font-normal ml-1">Looking up...</span>}
                        </label>
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleInputChange}
                            placeholder={lookingUp ? 'Fetching customer name...' : 'Enter customer full name'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Door No, Street, Area"
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Pincode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pincode
                        </label>
                        <input
                            type="text"
                            name="pincode"
                            maxLength="6"
                            value={formData.pincode}
                            onChange={(e) => handleInputChange({
                                target: {
                                    name: 'pincode',
                                    value: e.target.value.replace(/\D/g, '')
                                }
                            })}
                            placeholder="6-digit Pincode"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Order ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Order ID
                        </label>
                        <input
                            type="text"
                            name="orderId"
                            value={formData.orderId}
                            onChange={handleInputChange}
                            placeholder="Optional: Custom order ID"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Mode
                        </label>
                        <select
                            name="paymentMode"
                            value={formData.paymentMode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {paymentModes.map(mode => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </select>
                    </div>

                    {/* Package Weight */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Package Weight (grams)
                        </label>
                        <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleInputChange}
                            placeholder="Ex: 350"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handlePrintLabel}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
                    >
                        Generate & Print Label
                    </button>
                </CardContent>
            </Card>
        </div>
    );
};

export default DeliveryLabelPage;

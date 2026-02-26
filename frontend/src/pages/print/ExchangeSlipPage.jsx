import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import toast from 'react-hot-toast';

const ExchangeSlipPage = () => {
  const [formData, setFormData] = useState({
    mobile: '',
    customerName: '',
    reason: 'Size'
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrintSlip = () => {
    // Validate required fields
    if (!formData.mobile || formData.mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('Please enter reason for exchange');
      return;
    }

    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Exchange Slip</title>
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
            padding: 10px;
          }
          .header {
            text-align: center;
            font-size: 20px;
            font-weight: 900;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .subtitle {
            text-align: center;
            font-size: 14px;
            font-weight: 900;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .dashed-line {
            border-top: 2px dashed #000;
            margin: 10px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 13px;
            font-weight: bold;
          }
          .section-title {
            font-size: 14px;
            font-weight: 900;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .content {
            font-size: 14px;
            margin-bottom: 5px;
          }
          ul {
            padding-left: 15px;
            margin: 5px 0;
          }
          li {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .footer {
            text-align: center;
            font-size: 16px;
            font-weight: 900;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">VEEDRA THE BRAND</div>
          <div class="subtitle">EXCHANGE SLIP</div>
          
          <div class="dashed-line"></div>
          
          <div class="row">
            <span>Date</span>
            <span>${currentDate}</span>
          </div>
          <div class="row">
            <span>Time</span>
            <span>${currentTime}</span>
          </div>
          <div class="row">
            <span>Customer</span>
            <span>${formData.customerName}</span>
          </div>
          <div class="row">
            <span>Mobile</span>
            <span>${formData.mobile}</span>
          </div>
          
          <div class="dashed-line"></div>
          
          <div class="section-title">REASON FOR EXCHANGE</div>
          <div class="content">${formData.reason}</div>
          
          <div class="dashed-line"></div>
          
          <div class="subtitle">TERMS & CONDITIONS</div>
          <ul>
            <li>Valid only within 24 hours from bill</li>
            <li>Original bill & Exchange Slip is compulsory</li>
            <li>Tag must not be removed</li>
            <li>No damaged items accepted</li>
            <li>Item should not be dirty or used</li>
            <li>No cash refund</li>
          </ul>
          
          <div class="dashed-line"></div>
          
          <div class="footer">THANK YOU</div>
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Exchange Slip Entry</CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Customer Mobile
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
              placeholder="Enter mobile number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Customer Name {lookingUp && <span className="text-xs text-indigo-500 font-normal ml-1">Looking up...</span>}
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder={lookingUp ? 'Fetching customer name...' : 'Enter customer name'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Reason for Exchange
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Size, Defect, etc."
              rows="2"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none font-bold"
            />
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrintSlip}
            className="w-full py-3 bg-gray-100 text-black border-2 border-gray-200 rounded-lg hover:bg-gray-200 font-bold text-lg mt-4"
          >
            Print Exchange Slip
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExchangeSlipPage;


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
      // Also handle historical data where unitPrice is used
      const price = item.price || item.pricing?.offerPrice || item.unitPrice || 0;
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
      const mrp = item.pricing?.mrp || item.originalPrice || item.mrp || 0;
      // CRITICAL FIX: Use price field which contains adjusted price for combos
      const offerPrice = item.price || item.pricing?.offerPrice || item.unitPrice || 0;
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
          <div class="small">GSTIN: 29GJMPP54227F1Z0</div>
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
            <span>${new Date(bill.date || bill.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="flex-between">
            <span class="bold">Time:</span>
            <span class="bold">${new Date(bill.date || bill.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
        
        ${(bill.customer && (bill.customer.name || bill.customer.phone)) || (bill.customerName || bill.customerPhone) ? `
        <div style="margin-top: 2mm; font-size: 12px;">
          <div class="flex-between">
            <span class="bold">Customer:</span>
            <span class="bold">${bill.customer?.name || bill.customerName || 'N/A'}</span>
          </div>
          <div class="flex-between">
            <span class="bold">Mobile:</span>
            <span>${bill.customer?.phone || bill.customerPhone || 'N/A'}</span>
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
              ${item.hsnCode && item.hsnCode !== 'N/A' ? `<div style="font-size: 10px; color: #000; font-weight: bold;">HSN: ${item.hsnCode}</div>` : ''}
            </span>
            <span style="width: 9mm;">${fmt(mrp)}</span>
            <span style="width: 6mm; text-align: right;">${item.quantity}</span>
            <span style="width: 9mm; font-weight: bold;">${fmt(offerPrice)}</span>
            <span style="width: 11mm; font-weight: bold;">${fmt(offerPrice * item.quantity)}</span>
          </div>
        `;
      }).join('') : ''}

        ${bill.comboItems && bill.comboItems.length > 0 ?
      (bill.comboItems || []).map((item, index) => {
        // CRITICAL FIX: Use price field which contains the adjusted price
        const adjustedPrice = item.price || item.comboPrice || item.adjustedPrice || 0;
        const originalMRP = item.pricing?.mrp || item.originalPrice || 0;

        return `
          <div class="item-row">
            <span style="width: 20mm; word-wrap: break-word; line-height: 1.2;">
              ${item.name}
               ${item.hsnCode && item.hsnCode !== 'N/A' ? `<div style="font-size: 10px; color: #000; font-weight: bold;">HSN: ${item.hsnCode}</div>` : ''}
            </span>
            <span style="width: 9mm;">${fmt(originalMRP)}</span>
            <span style="width: 6mm; text-align: right;">${item.quantity}</span>
            <span style="width: 9mm; font-weight: bold;">${fmt(adjustedPrice)}</span>
            <span style="width: 11mm; font-weight: bold;">${fmt(adjustedPrice * item.quantity)}</span>
          </div>
        `;
      }).join('') : ''}
        
        ${(!bill.singlesItems && !bill.comboItems && bill.items) ?
      // Fallback for BillHistory where items aren't separated
      bill.items.map((item, index) => {
        const mrp = item.pricing?.mrp || item.originalPrice || item.mrp || item.price || 0; // rough estimate if missing
        const price = item.price || item.comboPrice || item.unitPrice || 0;
        return `
          <div class="item-row">
            <span style="width: 20mm; word-wrap: break-word; line-height: 1.2;">
              ${item.name || item.productName}
               ${item.hsnCode && item.hsnCode !== 'N/A' ? `<div style="font-size: 10px; color: #000; font-weight: bold;">HSN: ${item.hsnCode}</div>` : ''}
            </span>
            <span style="width: 9mm;">${fmt(mrp)}</span>
            <span style="width: 6mm; text-align: right;">${item.quantity}</span>
            <span style="width: 9mm; font-weight: bold;">${fmt(price)}</span>
            <span style="width: 11mm; font-weight: bold;">${fmt(item.total || (price * item.quantity))}</span>
          </div>
        `;
      }).join('') : ''}
        
        <div class="solid-divider"></div>
        
        <div style="font-size: 12px; margin-top: 2mm;">
          ${(() => {
      const allItems = [
        ...(bill.singlesItems || []),
        ...(bill.comboItems || []),
        ...(!bill.singlesItems && !bill.comboItems ? (bill.items || []) : [])
      ];
      const totalItems = allItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const gstBreakdown = calculateOverallGST(allItems);

      // Calculate actual discount
      const actualDiscount = calculateActualDiscount(allItems);

      // Calculate total MRP
      const totalMRP = allItems.reduce((sum, item) => {
        const mrp = item.pricing?.mrp || item.originalPrice || item.mrp || 0;
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
              <div class="flex-between" style="color: #000000;">
                <span>Discount:</span>
                <span class="bold">- ${fmt(actualDiscount)}</span>
              </div>
              <div class="solid-divider"></div>
              <div class="flex-between" style="margin: 2mm 0; padding: 1mm 0; border-bottom: 1px solid #000;">
                <span class="bold" style="font-size: 16px;">Net Payable:</span>
                <span class="bold" style="font-size: 22px;">${fmt(bill.total !== undefined ? bill.total : (totalMRP - actualDiscount))}</span>
              </div>
              
              ${(bill.loyalty) ? `
              <div class="divider"></div>
              <div style="font-size: 11px;">
                <div class="flex-between">
                  <span>Used Points:</span>
                  <span class="bold">${bill.loyalty.redeemedPoints || 0}</span>
                </div>
                <div class="flex-between">
                  <span>Points Price:</span>
                  <span class="bold">${fmt(bill.loyalty.pointValue || 0)}</span>
                </div>
              </div>
              ` : ''}
              <div class="divider"></div>
              <div class="flex-between">
                <span class="bold">Given Amount:</span>
                <span class="bold">${fmt(bill.receivedAmount || bill.total)}</span>
              </div>
              <div class="flex-between">
                <span>Return Amount:</span>
                <span class="bold">${fmt(bill.change || 0)}</span>
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
          
          ${(bill.loyalty) ? `
          <div class="flex-between" style="margin-top: 2mm;">
             <span>My available Points :</span>
             <span class="bold">${bill.loyalty.totalPoints || 0}</span>
          </div>
          <div class="flex-between">
             <span>Points From this bill :</span>
             <span class="bold" style="font-size: 10px;">
               ${(() => {
        if (bill.pointsBreakdown && bill.pointsBreakdown.length > 0) {
          const breakdownString = bill.pointsBreakdown
            .map(p => `${p.points}`)
            .join(' + ');
          const total = bill.loyalty.pointsEarned || 0;
          return `${breakdownString} = ${total}`;
        }
        return bill.loyalty.pointsEarned || 0;
      })()}
             </span>
          </div>
          ` : ''}
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

        ${bill.pointsBreakdown && bill.pointsBreakdown.length > 0 ? `
        <div class="divider"></div>
        <div class="center">
          <div class="bold small">Points Breakdown</div>
          <div style="font-size: 10px; margin-top: 1mm; text-align: left;">
            ${(() => {
        const breakdownString = bill.pointsBreakdown
          .map(p => `${p.points} (${p.productName.substring(0, 10)}..)`)
          .join(' + ');
        const totalPoints = bill.pointsBreakdown.reduce((sum, p) => sum + p.points, 0);
        return `<div style="word-wrap: break-word;">${breakdownString} = ${totalPoints} Pts</div>`;
      })()}
          </div>
        </div>
        ` : ''}
        
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

export default generateReceiptHTML;

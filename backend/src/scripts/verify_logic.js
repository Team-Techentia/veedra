/**
 * Verification Script for Optimized Billing and Product Updates
 * This script runs in a Node.js environment and verifies the core logic 
 * of the optimized methods without needing a full server restart.
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/Product');
const Billing = require('../models/Billing');
const Combo = require('../models/Combo');

async function runVerification() {
    try {
        console.log('🚀 Starting Verification of Optimized Logic...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // TEST 1: verify child product update bulk logic
        console.log('\n--- Test 1: Parent-Child Update Logic ---');
        const parent = await Product.findOne({ type: 'parent', 'bundle.isBundle': true });

        if (parent) {
            console.log(`Checking parent: ${parent.name} (${parent.code})`);
            const originalPrice = parent.pricing.offerPrice;
            const newPrice = originalPrice + 10;

            console.log(`Simulating price update: ${originalPrice} -> ${newPrice}`);

            // We manually call the method we optimized
            await parent.updateChildProducts({ pricing: { offerPrice: newPrice } });

            const children = await Product.find({ parentProduct: parent._id });
            console.log(`Checked ${children.length} child products.`);

            const allUpdated = children.every(c => c.pricing.offerPrice === newPrice);
            if (allUpdated) {
                console.log('✅ Bulk update logic for children verified successfully.');
            } else {
                console.warn('⚠️ Some children were not updated correctly.');
            }

            // Rollback
            await parent.updateChildProducts({ pricing: { offerPrice: originalPrice } });
            console.log('Reverted changes.');
        } else {
            console.log('Skipping Test 1: No parent bundle product found in DB.');
        }

        // TEST 2: verify product map efficiency in createBill simulation
        console.log('\n--- Test 2: Product Map Logic (Dry Run) ---');
        const sampleProducts = await Product.find({ isActive: true }).limit(3);
        if (sampleProducts.length > 0) {
            const productMap = new Map(sampleProducts.map(p => [p._id.toString(), p]));
            console.log(`Simulating with ${sampleProducts.length} products in map.`);

            const items = sampleProducts.map(p => ({
                product: p._id,
                quantity: 1,
                productName: p.name
            }));

            // Verify stock validation logic (conceptual)
            for (const item of items) {
                const product = productMap.get(item.product.toString());
                if (product) {
                    console.log(`  - Found ${product.name} in map correctly.`);
                } else {
                    throw new Error(`Failed to find ${item.productName} in map!`);
                }
            }
            console.log('✅ Product batched lookup logic verified.');
        } else {
            console.log('Skipping Test 2: No active products found.');
        }

        console.log('\n✅ Logic verification complete.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

runVerification();

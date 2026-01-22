const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const syncDatabase = async () => {
    let prodConn, safeConn;

    try {
        console.log('🔄 Starting Database Sync...');

        // 1. Validations
        if (!process.env.MONGODB_URI || !process.env.MONGODB_URI_SAFE) {
            throw new Error('❌ MONGODB_URI and MONGODB_URI_SAFE must be defined in .env');
        }

        if (process.env.MONGODB_URI === process.env.MONGODB_URI_SAFE) {
            throw new Error('❌ Safe URI is same as Production URI. Aborting sync to prevent data loss.');
        }

        // 2. Connect to Production (Source)
        console.log('🔌 Connecting to Production DB...');
        prodConn = await mongoose.createConnection(process.env.MONGODB_URI).asPromise();
        console.log('✅ Connected to Production DB');

        // 3. Connect to Safe Mode (Target)
        console.log('🔌 Connecting to Safe Mode DB...');
        safeConn = await mongoose.createConnection(process.env.MONGODB_URI_SAFE).asPromise();
        console.log('✅ Connected to Safe Mode DB');

        // 4. Get list of collections from Prod
        const collections = await prodConn.db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections to sync.`);

        for (const collection of collections) {
            const collName = collection.name;
            if (collName.startsWith('system.')) continue; // Skip system collections

            console.log(`\n📦 Syncing collection: ${collName}`);

            // Get data from Prod
            const ProdModel = prodConn.model(collName, new mongoose.Schema({}, { strict: false }), collName);
            const docs = await ProdModel.find({});
            console.log(`   ⬇️  Fetched ${docs.length} documents from Prod`);

            if (docs.length > 0) {
                // Clear Safe Collection
                const SafeModel = safeConn.model(collName, new mongoose.Schema({}, { strict: false }), collName);
                await SafeModel.deleteMany({});
                console.log(`   🧹 Cleared Safe collection`);

                // Insert into Safe
                await SafeModel.insertMany(docs);
                console.log(`   ⬆️  Inserted ${docs.length} documents into Safe DB`);
            } else {
                console.log(`   ⚠️  Collection is empty, skipping.`);
            }
        }

        console.log('\n✅ Database Sync Completed Successfully!');

    } catch (error) {
        console.error('\n❌ Sync Failed:', error.message);
        process.exit(1);
    } finally {
        if (prodConn) await prodConn.close();
        if (safeConn) await safeConn.close();
        process.exit(0);
    }
};

syncDatabase();

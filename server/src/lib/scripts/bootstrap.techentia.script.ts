import mongoose from "mongoose";
import { User, Organization } from "../../models/index.js";
import { Role } from "../consts/index.js";
import { helperUtils } from "../utils/index.js"

async function bootstrapTechentia() {
    const MONGO_URL = process.env.MONGO_URL!;
    await mongoose.connect(MONGO_URL);

    const email = String(process.env.TECHENTIA_BOOTSTRAP_EMAIL || "").toLowerCase().trim();
    const password = String(process.env.TECHENTIA_BOOTSTRAP_PASSWORD || "");
    const orgName = String(process.env.TECHENTIA_SYSTEM_ORG_NAME || "Techentia Platform");

    if (!email || !password) throw new Error("Missing TECHENTIA_BOOTSTRAP_EMAIL or TECHENTIA_BOOTSTRAP_PASSWORD");

    // ✅ 1) ensure system org exists
    let org = await Organization.findOne({ name: orgName });
    if (!org) {
        org = await Organization.create({
            orgId: "veedra",
            name: orgName,
            legalName: orgName,
            currency: "INR",
            country: "IN",
            timezone: "Asia/Kolkata",
            taxSystem: "NONE",
            plan: "PRO",
            ownerUserId:"NUPO5NiIWDwUG7",
            featureFlags: {},
            isActive: true,
        });
    }

    // ✅ 2) check if super admin exists
    const existing = await User.findOne({
        roles: Role.TENANT_SUPER_ADMIN,
        globalScope: false,
        isDeleted: false,
    });

    if (existing) {
        console.log("✅ Techentia Super Admin already exists:", existing.email);
        process.exit(0);
    }

    // ✅ 3) create super admin
    const passwordHash = await helperUtils.password.hash(password);

    const user = new User({
        orgId: org._id,
        userId: helperUtils.id.nanoid(),

        email,
        name: "Ganesh",

        auth: {
            providers: [{ provider: "LOCAL", isPrimary: true, linkedAt: new Date() }],
            passwordHash,
            passwordUpdatedAt: new Date(),

            mfaEnabled: false,
            mfaMethod: "NONE",

            failedLoginCount: 0,
        },

        roles: [Role.TENANT_SUPER_ADMIN],
        globalScope: false,
        orgScopes: [org._id],
        branchScopes: [],

        permissionOverrides: { allow: [], deny: [] },

        status: "ACTIVE",
        isDeleted: false,
    });

    await user.save();

    // ✅ set org owner
    org.ownerUserId = user._id;
    await org.save();

    console.log("✅ Created Techentia Super Admin:", user.email);
    process.exit(0);
}

bootstrapTechentia().catch((err) => {
    console.error("❌ bootstrapTechentia failed:", err);
    process.exit(1);
});
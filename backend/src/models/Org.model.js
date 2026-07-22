import mongoose, { Schema } from 'mongoose';



const addressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true }
}, { _id: false });

const licenseSchema = new mongoose.Schema({
  // The official Form 20/21 CDSCO Drug License Number
  number: { type: String, required: true, trim: true },
  // Expiry date (Super Admin uses this to verify legal trading status)
  expiryDate: { type: Date, required: true },
  
  documentUrl: { type: String, required: true, trim: true } 
}, { _id: false });

const organizationProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // GSTIN for B2B tax invoicing
  taxId: { type: String, required: true, unique: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  address: { type: addressSchema, required: true },
  license: { type: licenseSchema, required: true }
}, { _id: false });



const creditProfileSchema = new mongoose.Schema({
  // Maximum allowable unpaid balance (Defaults to ₹50,000 for new signups)
  creditLimit: { 
    type: Number, 
    required: true, 
    default: 50000, 
    min: 0 
  },
  // Active debt (Updated ONLY via ACID transactions matching the chemist_ledger_entries table)
  currentOutstanding: { 
    type: Number, 
    required: true, 
    default: 0,     
    min: 0 
  },
  // Standard payment window (Net-14 terms)
  creditDays: { 
    type: Number, 
    required: true, 
    default: 14     
  },
  // True if an invoice exceeds 15 days overdue. Hard-blocks the "Bill to Trade Credit" checkout button.
  isCreditFrozen: { 
    type: Boolean, 
    required: true, 
    default: false  
  },
  // Automated reason for freeze (e.g., "Invoice #8841 is 16 days overdue")
  freezeReason: { 
    type: String, 
    trim: true, 
    default: null   
  }
}, { _id: false });



const settlementProfileSchema = new mongoose.Schema({
  // Unique Razorpay/Cashfree Virtual Account Number assigned to this chemist.
  // When NEFT/RTGS money lands here, a webhook automatically reduces 'currentOutstanding'.
  virtualAccountId: { type: String, trim: true, default: null }, 
  
  //Stores the Gateway Customer ID to save their payment methods for faster online checkout.
  pgCustomerId: { type: String, trim: true, default: null }
}, { _id: false });



const orgSchema = new mongoose.Schema({
  // Core Business Identity
  organization: { 
    type: organizationProfileSchema, 
    required: true 
  },
  // Financial Wallet (Auto-populates defaults on creation)
  creditProfile: { 
    type: creditProfileSchema, 
    default: () => ({}) 
  },
  // Gateway Links (Auto-populates defaults on creation)
  settlementProfile: {
    type: settlementProfileSchema,
    default: () => ({})
  },
  // Legal KYC Gateway: Controls access to the storefront catalog and pricing.
  // 'pending' = Locked. 'approved' = Trading Live. 'rejected' = Uploads denied.
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  // Admin feedback shown to chemist if status === 'rejected' (e.g., "Form 20 PDF is blurry")
  statusRemarks: { 
    type: String, 
    trim: true, 
    default: null 
  }
}, { timestamps: true });

// ─── 5. PERFORMANCE INDEXES ──────────────────────────────────────────────────

// Optimizes Super Admin queries for "Blocked Accounts"
orgSchema.index({ "creditProfile.isCreditFrozen": 1 });

// Optimizes Accounts Receivable (A/R) dashboard sorting (Highest debt to lowest)
orgSchema.index({ "creditProfile.currentOutstanding": -1 });

// Ensure fast lookups when a Razorpay Webhook hits
orgSchema.index({ "settlementProfile.virtualAccountId": 1 });

export const Org = mongoose.model('Org', orgSchema);
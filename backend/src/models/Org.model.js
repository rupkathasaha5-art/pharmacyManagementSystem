import mongoose, { Schema } from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true }
}, { _id: false });

const licenseSchema = new mongoose.Schema({
  number: { type: String, required: true, trim: true },
  expiryDate: { type: Date, required: true } 
}, { _id: false });

const organizationProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  taxId: { type: String, required: true, unique: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  address: { type: addressSchema, required: true },
  license: { type: licenseSchema, required: true }
}, { _id: false });


/*const primaryAdminSchema = new mongoose.Schema({
  userRef: { 
    type: Schema.Types.ObjectId, 
    ref:'User', 
    required:true
  }
}, { _id: false });*/

const orgSchema = new mongoose.Schema({
  organization: { type: organizationProfileSchema, required: true },
  //primaryAdmin: { type: primaryAdminSchema, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

export const Org = mongoose.model('Org', orgSchema);


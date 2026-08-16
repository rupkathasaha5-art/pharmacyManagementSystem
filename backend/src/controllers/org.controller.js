import fs from 'fs';
import { User } from '../models/User.model.js'; 
import { Org } from '../models/Org.model.js';   
import { ApiError } from '../utils/ApiError.js';       
import { ApiResponse } from '../utils/ApiResponse.js'; 
import { asyncHandler } from '../utils/asyncHandler.js'; 
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from '../utils/cloudinary.js';


const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isDateValid = (dateString) => !isNaN(Date.parse(dateString));


const getValueByPath = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};


const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};


const registerOrg = asyncHandler(async (req, res, next) => {
  
  let organization;
  try {
    const parsedData = JSON.parse(req.body.data);
    organization = parsedData.organization;
  } catch (parseError) {
    cleanupTempFile(req.file?.path);
    return res.status(400).json(
      new ApiError(400, 'Validation Blocked: Malformed organization data payload.', ['organization'])
    );
  }

  // 1. mapping every required input field to a clean label
  const requiredFields = [
    
    { path: 'name', label: 'Legal Entity Name' },
    { path: 'taxId', label: 'Corporate Tax ID / Registration Code' },
    { path: 'phone', label: 'Corporate Phone number' },
    { path: 'email', label: 'Corporate Procurement Email', isEmail: true },
    { path: 'address.street', label: 'Shipping Street Address' },
    { path: 'address.city', label: 'Shipping City' },
    { path: 'address.state', label: 'Shipping State / Region' },
    { path: 'address.postalCode', label: 'Shipping Postal Code' },
    { path: 'license.number', label: 'Drug License Identification Number' },
    { path: 'license.expiryDate', label: 'License Expiration Milestone Date', isDate: true }
  ];

  // 2. validation 
  for (const field of requiredFields) {
    const value = getValueByPath(organization, field.path);

    // Check for missing, empty, or whitespace-only values
    if (!value || (typeof value === 'string' && !value.trim())) {
      cleanupTempFile(req.file?.path);
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} is required.`, [field.path])
      );
    }

    // Check for explicit string length restrictions
    if (field.minLength && String(value).length < field.minLength) {
      cleanupTempFile(req.file?.path);
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} requires a minimum of ${field.minLength} characters.`, [field.path])
      );
    }

    // Check for specialized format matches (Emails)
    if (field.isEmail && !isEmailValid(value)) {
      cleanupTempFile(req.file?.path);
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} format is invalid.`, [field.path])
      );
    }

    // Check for specialized format matches (Dates)
    if (field.isDate && !isDateValid(value)) {
      cleanupTempFile(req.file?.path);
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} format is invalid.`, [field.path])
      );
    }
  }

  // 2b. License document is required — multer's fileFilter already restricts
  // this to PDFs, so here we're only confirming one was actually attached.
  if (!req.file) {
    return res.status(400).json(
      new ApiError(400, 'Validation Blocked: Drug License PDF is required.', ['organization.license.documentUrl'])
    );
  }

  // 2c. Upload the license PDF to Cloudinary before touching the database.
  // If this fails, there's nothing to roll back yet, so we can bail cleanly.
  const cloudinaryResponse = await uploadFileOnCloudinary(req.file.path);
  if (!cloudinaryResponse) {
    return res.status(500).json(
      new ApiError(500, 'Upload Failed: Could not store the license document. Please try again.', ['organization.license.documentUrl'])
    );
  }

 
  // 3. DATABASE EXECUTION
  
  let savedOrg;
  try {
    savedOrg = await Org.create({
      organization: {
        name: organization.name.trim(),
        taxId: organization.taxId.trim(),
        phone: organization.phone.trim(),
        email: organization.email.toLowerCase().trim(),
        address: {
          street: organization.address.street.trim(),
          city: organization.address.city.trim(),
          state: organization.address.state.trim(),
          postalCode: organization.address.postalCode.trim()
        },
        license: {
          number: organization.license.number.trim(),
          expiryDate: new Date(organization.license.expiryDate),
          documentUrl: cloudinaryResponse.secure_url
        }
      },
    });
  } catch (dbError) {
   
    await deleteFileFromCloudinary(cloudinaryResponse.public_id, 'raw');

    
    if (dbError.code === 11000) {
      return res.status(400).json(
        new ApiError(400, 'Registration Blocked: A corporate profile with this duplicate data (Tax ID) already exists.', ['organization.taxId'])
      );
    }
   
    throw dbError;
  }

 
  const responsePayload = {
    
    orgId: savedOrg._id,
    companyName: savedOrg.organization.name
  };

 
  return res.status(201).json(
    new ApiResponse(201, responsePayload, 'Corporate onboarding completed successfully!')
  );
});


export { registerOrg };
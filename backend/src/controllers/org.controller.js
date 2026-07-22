import fs from 'fs';
import { User } from '../models/User.model.js'; 
import { Org } from '../models/Org.model.js';   
import { ApiError } from '../utils/ApiError.js';       
import { ApiResponse } from '../utils/ApiResponse.js'; 
import { asyncHandler } from '../utils/asyncHandler.js'; 
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from '../utils/cloudinary.js';

//for format compliance checks
const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isDateValid = (dateString) => !isNaN(Date.parse(dateString));

//dynamically extract nested object values using string paths
const getValueByPath = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// Safely removes the multer temp file so failed/invalid submissions
// don't leave orphaned PDFs sitting in ./public/temp
const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};


const registerOrg = asyncHandler(async (req, res, next) => {
  // 0. Parse the nested organization payload out of the multipart "data" field.
  // (multer puts non-file fields into req.body as raw strings, so this is no
  // longer a plain JSON body — it travels as a stringified field alongside the file)
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
    //{ path: 'primaryAdmin.name', label: 'Administrator Full Name' },
    //{ path: 'primaryAdmin.email', label: 'Personal Login Email', isEmail: true },
    //{ path: 'primaryAdmin.password', label: 'Secure Password', minLength: 8 },
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

  // 2. Execute the validation sweep loop over the payload matrix
  for (const field of requiredFields) {
    const value = getValueByPath(organization, field.path);

    // Check for missing, empty, or whitespace-only values
    if (!value || (typeof value === 'string' && !value.trim())) {
      cleanupTempFile(req.file?.path);
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} is required.`, [field.path])
      );
    }

    // Check for explicit string length restrictions (e.g., Password)
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

  // ==========================================
  // 3. DATABASE EXECUTION
  // ==========================================
  //const { primaryAdmin } = req.body;

  // Check if user email already exists before starting execution
  /*const existingUser = await User.findOne({ email: primaryAdmin.email.toLowerCase().trim() });
  if (existingUser) {
    return res.status(400).json(
      new ApiError(400, 'Registration Blocked: Administrator email account is already registered.', ['primaryAdmin.email'])
    );
  }*/

  // Step A: Instantiate the User record securely
  /*const savedUser = await User.create({
    name: primaryAdmin.name.trim(),
    email: primaryAdmin.email.toLowerCase().trim(),
    password: primaryAdmin.password,
    org:
  });*/

  // Step B: Instantiate the Org record with normalized parameters
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
      /*primaryAdmin: {
        userRef: savedUser._id 
      }*/
    });
  } catch (dbError) {
    // Rollback: the file already landed on Cloudinary, but the Org record
    // failed to save, so remove the orphaned upload to avoid dangling assets.
    await deleteFileFromCloudinary(cloudinaryResponse.public_id, 'raw');

    // Intercept database duplicate unique key index (e.g., repeating a Corporate Tax ID)
    if (dbError.code === 11000) {
      return res.status(400).json(
        new ApiError(400, 'Registration Blocked: A corporate profile with this duplicate data (Tax ID) already exists.', ['organization.taxId'])
      );
    }
    // Forward any other unexpected structural DB errors up to the handler pipeline
    throw dbError;
  }

  // Structure the returned data payload for frontend accessibility
  const responsePayload = {
    //userId: savedUser._id,
    orgId: savedOrg._id,
    companyName: savedOrg.organization.name
  };

  // Return the formatted ApiResponse class instance
  return res.status(201).json(
    new ApiResponse(201, responsePayload, 'Corporate onboarding completed successfully!')
  );
});


export { registerOrg };
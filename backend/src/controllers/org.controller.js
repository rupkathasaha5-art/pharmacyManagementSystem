import { User } from '../models/User.model.js'; 
import { Org } from '../models/Org.model.js';   
import { ApiError } from '../utils/ApiError.js';       
import { ApiResponse } from '../utils/ApiResponse.js'; 
import { asyncHandler } from '../utils/asyncHandler.js'; 

//for format compliance checks
const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isDateValid = (dateString) => !isNaN(Date.parse(dateString));

//dynamically extract nested object values using string paths
const getValueByPath = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};


const registerOrg= asyncHandler(async (req, res, next) => {
  // 1. mapping every required input field to a clean label
  const requiredFields = [
    //{ path: 'primaryAdmin.name', label: 'Administrator Full Name' },
    //{ path: 'primaryAdmin.email', label: 'Personal Login Email', isEmail: true },
    //{ path: 'primaryAdmin.password', label: 'Secure Password', minLength: 8 },
    { path: 'organization.name', label: 'Legal Entity Name' },
    { path: 'organization.taxId', label: 'Corporate Tax ID / Registration Code' },
    { path: 'organization.phone', label: 'Corporate Phone number' },
    { path: 'organization.email', label: 'Corporate Procurement Email', isEmail: true },
    { path: 'organization.address.street', label: 'Shipping Street Address' },
    { path: 'organization.address.city', label: 'Shipping City' },
    { path: 'organization.address.state', label: 'Shipping State / Region' },
    { path: 'organization.address.postalCode', label: 'Shipping Postal Code' },
    { path: 'organization.license.number', label: 'Drug License Identification Number' },
    { path: 'organization.license.expiryDate', label: 'License Expiration Milestone Date', isDate: true }
  ];

  // 2. Execute the validation sweep loop over the payload matrix
  for (const field of requiredFields) {
    const value = getValueByPath(req.body, field.path);

    // Check for missing, empty, or whitespace-only values
    if (!value || (typeof value === 'string' && !value.trim())) {
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} is required.`, [field.path])
      );
    }

    // Check for explicit string length restrictions (e.g., Password)
    if (field.minLength && String(value).length < field.minLength) {
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} requires a minimum of ${field.minLength} characters.`, [field.path])
      );
    }

    // Check for specialized format matches (Emails)
    if (field.isEmail && !isEmailValid(value)) {
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} format is invalid.`, [field.path])
      );
    }

    // Check for specialized format matches (Dates)
    if (field.isDate && !isDateValid(value)) {
      return res.status(400).json(
        new ApiError(400, `Validation Blocked: ${field.label} format is invalid.`, [field.path])
      );
    }
  }

  // ==========================================
  // 3. DATABASE EXECUTION
  // ==========================================
  //const { organization, primaryAdmin } = req.body;
  const { organization } = req.body;

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
          expiryDate: new Date(organization.license.expiryDate)
        }
      },
      /*primaryAdmin: {
        userRef: savedUser._id 
      }*/
    });
  } catch (dbError) {
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


export {registerOrg};
module.exports = {
  // API URL for internal service communication
  API_URL: process.env.API_URL || 'http://localhost:8000',
  
  // MongoDB connection string
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/mini-crm',
  
  // JWT secret for authentication
  JWT_SECRET: process.env.JWT_SECRET || 'XenoSecretJwt1421a',
  
  // Session configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'XenoSecretJwt1421a',
  
  // Server port
  PORT: process.env.PORT || 8000,
  // Open Api
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || 'AIzaSyDpaEZl-43UKeklvNBQMQ4buZwpaJKYR3Y', // Replace with a secure fallback or remove in production
  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Company Name
  COMPANY_NAME: process.env.COMPANY_NAME || 'Your Company Name', // Replace with your actual company name or load from .env
  
  // Vendor API configuration
  VENDOR_API: {
    BASE_URL: process.env.VENDOR_API_URL || 'http://localhost:8000/api/vendor',
    TIMEOUT: 5000, // 5 seconds
    RETRY_ATTEMPTS: 3
  }
}; 
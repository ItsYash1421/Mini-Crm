# API Documentation for Mini CRM

## Setup Instructions

### 1. Install Postman
1. Download Postman from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
2. Install and open Postman
3. Create a new account or sign in

### 2. Create a New Collection
1. Click "Collections" in the sidebar
2. Click the "+" button to create a new collection
3. Name it "Mini CRM APIs"
4. Click "Create"

### 3. Environment Setup
1. Click "Environments" in the sidebar
2. Click the "+" button to create a new environment
3. Name it "Mini CRM Local"
4. Add these variables:
   - `base_url`: `http://localhost:3000` (or your backend URL)
   - `token`: Leave empty for now
5. Click "Save"
6. Select the "Mini CRM Local" environment from the dropdown in the top right

## API Endpoints

### Authentication
Before using other APIs, you need to get an authentication token.

#### Login
- **Method**: POST
- **URL**: `{{base_url}}/api/auth/login`
- **Body** (raw JSON):
```json
{
    "email": "your-email@example.com",
    "password": "your-password"
}
```
- **Headers**:
  - Content-Type: application/json

After successful login, copy the token from the response and set it in your environment variables.

### Customer APIs

#### 1. Create Customer
- **Method**: POST
- **URL**: `{{base_url}}/api/customers`
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer {{token}}
- **Body** (raw JSON):
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "segment": "premium"
}
```

#### 2. Get All Customers
- **Method**: GET
- **URL**: `{{base_url}}/api/customers`
- **Headers**:
  - Authorization: Bearer {{token}}

#### 3. Get Single Customer
- **Method**: GET
- **URL**: `{{base_url}}/api/customers/:id`
- **Headers**:
  - Authorization: Bearer {{token}}

#### 4. Update Customer
- **Method**: PATCH
- **URL**: `{{base_url}}/api/customers/:id`
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer {{token}}
- **Body** (raw JSON):
```json
{
    "name": "John Updated",
    "email": "john.updated@example.com"
}
```

#### 5. Delete Customer
- **Method**: DELETE
- **URL**: `{{base_url}}/api/customers/:id`
- **Headers**:
  - Authorization: Bearer {{token}}

### Order APIs

#### 1. Create Order
- **Method**: POST
- **URL**: `{{base_url}}/api/orders`
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer {{token}}
- **Body** (raw JSON):
```json
{
    "customerId": "customer_id_here",
    "amount": 299.99,
    "status": "pending",
    "items": [
        {
            "name": "Product 1",
            "quantity": 2,
            "price": 149.99
        }
    ]
}
```

#### 2. Get All Orders
- **Method**: GET
- **URL**: `{{base_url}}/api/orders`
- **Headers**:
  - Authorization: Bearer {{token}}

#### 3. Get Single Order
- **Method**: GET
- **URL**: `{{base_url}}/api/orders/:id`
- **Headers**:
  - Authorization: Bearer {{token}}

#### 4. Update Order
- **Method**: PATCH
- **URL**: `{{base_url}}/api/orders/:id`
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer {{token}}
- **Body** (raw JSON):
```json
{
    "status": "completed",
    "amount": 349.99
}
```

#### 5. Delete Order
- **Method**: DELETE
- **URL**: `{{base_url}}/api/orders/:id`
- **Headers**:
  - Authorization: Bearer {{token}}

## Testing the APIs

### Step-by-Step Testing Process

1. **Start Your Backend Server**
   ```bash
   cd backend
   npm start
   ```

2. **Login and Get Token**
   - Open Postman
   - Send the login request
   - Copy the token from the response
   - Set it in your environment variables

3. **Create a Customer**
   - Use the Create Customer endpoint
   - Save the returned customer ID for later use

4. **Create an Order**
   - Use the Create Order endpoint
   - Use the customer ID from step 3
   - Save the returned order ID

5. **Test Other Operations**
   - Try updating the customer and order
   - Test retrieving the data
   - Test deletion (if needed)

### Response Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

### Tips for Using Postman
1. Use the "Save" button to save your requests
2. Use the "Tests" tab to write automated tests
3. Use the "Pre-request Script" tab to set up variables
4. Use the "Collections Runner" to run multiple requests in sequence
5. Use the "Environment" dropdown to switch between different environments (development, staging, production)

### Common Issues and Solutions
1. **CORS Issues**: Make sure your backend has CORS enabled
2. **Authentication Errors**: Check if your token is valid and properly set
3. **404 Errors**: Verify the API endpoint URL and parameters
4. **500 Errors**: Check the server logs for detailed error messages 
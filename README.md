# ✨ Mini CRM - Marketing Campaign Management System ✨

### A modern, full-stack CRM application built with the MERN stack for managing marketing campaigns and customer relationships.

## 🌐 Live Demo

Visit the deployed application: [Mini CRM](https://mini-qhmrk9me0-yash-kumar-meenas-projects.vercel.app)

## 🚀 Features

- **🛡️ Secure Authentication**
  - Google OAuth integration
  - JWT-based authentication
  - Protected routes

- **📈 Campaign Management**
  - Create and manage marketing campaigns
  - Track campaign status and performance
  - Campaign history and analytics

- **👥 Customer Management**
  - Add and manage customer profiles
  - Track customer interactions
  - Communication history

- **📊 Dashboard Analytics**
  - Real-time campaign statistics
  - Customer engagement metrics
  - Performance insights

- **📱 Responsive Design**
  - Mobile-first approach
  - Optimized for all devices
  - Modern UI/UX

## 🛠️ Tech Stack

### Frontend
- React.js
- TypeScript
- Material-UI
- React Router
- Axios
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Passport.js for authentication
- JWT for session management

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Google OAuth credentials

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ItsYash1421/Mini-Crm.git
   cd mini-crm
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

5. Create a `.env` file in the frontend directory:
   ```
   VITE_API_URL=your_backend_url
   ```

## 🚀 Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## 🔐 Environment Variables

### Backend (.env)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `PORT`: Server port (default: 8000)

### Frontend (.env)
- `VITE_API_URL`: Backend API URL

## 📱 API Endpoints

### Authentication
- `POST /api/auth/google`: Google OAuth login
- `GET /api/auth/google/callback`: Google OAuth callback
- `GET /api/auth/me`: Get current user info

### Campaigns
- `GET /api/campaigns`: Get all campaigns
- `POST /api/campaigns`: Create new campaign
- `PUT /api/campaigns/:id`: Update campaign
- `DELETE /api/campaigns/:id`: Delete campaign

### Customers
- `GET /api/customers`: Get all customers
- `POST /api/customers`: Add new customer
- `PUT /api/customers/:id`: Update customer
- `DELETE /api/customers/:id`: Delete customer

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy

### Backend (Render)
1. Create a new Web Service
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy

## 📧 Contact

Yash Kumar Meena - [yashamanmeena2@gmail.com](mailto:yashamanmeena2@gmail.com)

Project Link: [https://github.com/ItsYash1421/Mini-Crm](https://github.com/ItsYash1421/Mini-Crm) 

# URL Shortener - Complete Setup Guide

### System Requirements
- **Node.js**: v16.0.0 or higher (LTS recommended)
- **npm**: v8.0.0 or higher (comes with Node.js)
- **MongoDB**: v5.0 or higher (local or cloud)
- **Git**: Latest version for version control

### Optional Tools
- **MongoDB Compass**: GUI for MongoDB management
- **Postman**: API testing and development
- **VS Code**: Recommended IDE with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint
  - MongoDB for VS Code

## Development Setup


```bash
# Clone the repository
git clone <repository-url>
cd urlshortner

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Directory Structure Verification

Ensure your project structure matches:
```
urlshortner/
├── server/                  # Backend application
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Business logic controllers
│   │   ├── middleware/     # Custom middleware functions
│   │   ├── models/         # MongoDB/Mongoose models
│   │   ├── routes/         # API route definitions
│   │   ├── tests/          # Jest test suites
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Server entry point
│   ├── logs/               # Application logs
│   ├── package.json
│   └── jest.config.js
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React Context providers
│   │   ├── pages/         # Page-level components
│   │   ├── services/      # API service functions
│   │   └── App.js         # Main React component
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```
## Environment Variables

### Backend Environment Setup

1. **Create Environment File**
   ```bash
   cd server
   cp env.template .env
   ```

2. **Configure Environment Variables**
   Edit `.env` with your preferred editor:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   # For MongoDB Atlas:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urlshortener?retryWrites=true&w=majority
   # For Local MongoDB:
   # MONGODB_URI=mongodb://localhost:27017/urlshortener
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   JWT_EXPIRE=7d
   
   # Application URLs
   BASE_URL=http://localhost:3000
   API_BASE_URL=http://localhost:5000
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   
   # Logging Level
   LOG_LEVEL=info
   ```


## Running the Application

### Development Mode

1. **Start Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   - Server runs on http://localhost:5000
   - Auto-restarts on file changes
   - Logs appear in console and `logs/` directory

2. **Start Frontend Development Server**
   ```bash
   cd client
   npm start
   ```
   - Client runs on http://localhost:3000
   - Hot reload enabled
   - Opens browser automatically

3. **Verify Setup**
   - Backend health check: http://localhost:5000/api/health
   - Frontend application: http://localhost:3000
   - Database connection: Check server logs for MongoDB connection success

## Testing

### Backend Testing

```bash
cd server

# Run all tests
npm test


# Run specific test file
npm test auth.test.js
```

```

```
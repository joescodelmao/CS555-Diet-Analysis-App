# CS555 Diet Analysis App

A web application for diet analysis and user profile management built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication**: Secure user registration and login system with password validation
- **Profile Management**: Create and edit user profiles with personal information
- **Session Management**: Persistent user sessions with secure logout
- **Responsive Design**: Clean, modern UI with custom CSS styling
- **Data Validation**: Comprehensive input validation and error handling

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Template Engine**: Handlebars
- **Authentication**: bcrypt for password hashing
- **Session Management**: express-session
- **Frontend**: HTML, CSS, JavaScript

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)
- npm (Node Package Manager)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/joescodelmao/CS555-Diet-Analysis-App.git
   cd CS555-Diet-Analysis-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm install multer path fs
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your local machine:
   ```bash
   mongod
   ```

4. **Run the application**
   ```bash
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
CS555-Diet-Analysis-App/
├── app.js                 # Main application entry point
├── package.json           # Project dependencies and scripts
├── config/                # Configuration files
│   ├── mongoCollections.js
│   ├── mongoConnection.js
│   └── settings.js
├── data/                  # Data access layer
│   ├── profiles.js        # Profile data operations
│   └── users.js           # User data operations
├── helpers.js             # Utility functions and validators
├── public/                # Static assets
│   ├── css/               # Stylesheets
│   └── js/                # Client-side JavaScript
├── routes/                # Route handlers
│   ├── index.js           # Main route configuration
│   ├── main.js            # Authentication routes
│   └── profile.js         # Profile management routes
└── views/                 # Handlebars templates
    ├── layouts/
    │   └── main.handlebars
    ├── home.handlebars
    ├── login.handlebars
    ├── profile.handlebars
    ├── profile_edit.handlebars
    └── register.handlebars
```

## 🔧 Configuration

The application uses the following configuration:

- **Database**: MongoDB running on `mongodb://localhost:27017/`
- **Database Name**: `Diet-Analysis-App`
- **Port**: 3000
- **Session Secret**: Configured in `app.js` (change for production)

## 📝 API Endpoints

### Authentication Routes
- `GET /` - Home page
- `GET /register` - Registration form
- `POST /register` - Create new user account
- `GET /login` - Login form
- `POST /login` - Authenticate user
- `GET /logout` - Logout user

### Profile Routes (Protected)
- `GET /profile` - View user profile
- `GET /profile/edit` - Edit profile form
- `POST /profile/edit` - Update profile information

### Other Routes
- `GET /home` - Dashboard (requires authentication)

## 🔐 User Registration Requirements

- **Username**: 
  - Minimum 5 characters
  - Must contain at least one letter
  - Only alphanumeric characters allowed
  - Case insensitive

- **Password**:
  - Minimum 8 characters
  - Must contain at least one uppercase letter
  - Must contain at least one lowercase letter
  - Must contain at least one number
  - Must contain at least one special character
  - No spaces allowed

## 👥 Profile Information

Users can create and manage profiles with the following information:
- Name
- Age
- Height
- Weight
- Goal

## 🧪 Testing

The project includes Python-based testing files in the `test/` directory:
- `signup.py` - Signup functionality tests
- `test_signup.py` - Additional signup tests

## 👨‍💻 Development Team

- Owen Treanor
- Jimmy Colgan
- Sabrina Trestin
- Kyle Michael Pingue
- Hadeer Motair
- Joseph Gargiulo

## 📄 License

This project is licensed under the ISC License.

## 🐛 Issues

If you encounter any issues or have suggestions, please create an issue on the [GitHub repository](https://github.com/joescodelmao/CS555-Diet-Analysis-App/issues).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

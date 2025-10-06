# Event Ticketing Website

A full-stack platform for selling and managing event tickets with an Oracle Database backend and React frontend.

## Features

- List all events
- Create ticketed events
- Edit event details
- Delete events
- View detailed event and ticket information
- Responsive UI with Bootstrap

## Prerequisites

- Node.js (v14 or higher)
- Oracle Database (with the schema setup)
- Oracle Instant Client installed at `C:\OracleClint\instantclient_21_17`

## Project Structure

```
theater-booking-app/
├── client/                      # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ShowList.jsx
│   │   │   ├── ShowForm.jsx
│   │   │   ├── ShowDetails.jsx
│   │   │   └── Navbar.jsx
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── styles.css
│   └── package.json
├── server/                      # Express backend
│   ├── config/
│   │   └── dbConfig.js
│   ├── controllers/
│   │   └── showController.js
│   ├── routes/
│   │   └── shows.js
│   ├── db/
│   │   └── oracleConnection.js
│   ├── server.js
│   └── package.json
└── database/
    └── schema.sql              # Database schema
```

## Setup Instructions

### 1. Database Setup

1. Connect to your Oracle Database using your preferred client (e.g., SQL*Plus, Oracle SQL Developer)
2. Run the SQL script from the `database/schema.sql` file to create the necessary tables, sequences, and stored procedures

### 2. Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure your Oracle Database connection:
   - Open `config/dbConfig.js`
   - Replace the placeholder values with your actual Oracle credentials:
     ```javascript
     module.exports = {
       user: "YOUR_USERNAME",
       password: "YOUR_PASSWORD",
       connectString: "localhost:1521/YOUR_SID",
       externalAuth: false,
       instantClientDir: "C:\\OracleClint\\instantclient_21_17"
     };
     ```

4. Start the server:
   ```
   npm start
   ```
   The server will run on port 5000 by default.

### 3. Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```
   The application will be available at http://localhost:3000

## API Endpoints

- **GET /api/shows** - Get all shows
- **GET /api/shows/:id** - Get a specific show by ID
- **POST /api/shows** - Create a new show
- **PUT /api/shows/:id** - Update a show
- **DELETE /api/shows/:id** - Delete a show

## Troubleshooting

### Oracle Instant Client Issues

If you encounter issues with the Oracle Instant Client:

1. Ensure the path is correct in `dbConfig.js`
2. Make sure you have the correct version of Instant Client for your Oracle Database version
3. Add the Instant Client directory to your system PATH

### Database Connection Issues

If you have trouble connecting to the Oracle Database:

1. Verify your database credentials in `dbConfig.js`
2. Check that your Oracle Database is running
3. Ensure that the Oracle Instant Client is properly configured

## License

This project is licensed under the MIT License.
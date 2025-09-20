Virtual Event Backend API
This backend API provides user authentication, event management, and registration functionality for a virtual event platform. It is built with Node.js, Express, MongoDB, and JWT authentication.

Features
User registration and login with JWT-based authentication

Role-based access control for organizers and attendees

Event creation, update, deletion by organizers

Event registration by attendees with email confirmation

Retrieval of events and user-participated events

Secure password hashing using bcrypt

Technologies Used
Node.js

Express.js

MongoDB & Mongoose

JSON Web Tokens (JWT)

bcrypt for password hashing

Jest & Supertest for testing

mongodb-memory-server for in-memory MongoDB tests

Nodemailer for email notifications

Getting Started
Prerequisites
Node.js >=14.x

npm

MongoDB instance (for production; tests use in-memory MongoDB)

Installation
Clone the repo:
git clone <repository-url>
cd virtual-event-backend


Install dependencies:
npm install

I have already created one .env file in the root directory and defined the following environment variables:
NOTE:- Please don't disclose this credentials. I will change after 30 days of submiting to airtribe.

PORT=3000
MONGO_URI
JWT_SECRET
EMAIL_USER
EMAIL_PASS

Running the Server
Start the server:
npm run start
The API will be available at http://localhost:3000.

API Endpoints
Auth
POST /api/auth/register - Register a user (requires username, email, password, role)

POST /api/auth/login - Login with email and password

GET /api/auth/logout - Logout user

Events
GET /api/events - Get all events (requires authentication)

POST /api/events/create-events - Create a new event (organizer only)

POST /api/events/:id/register - Register for event (attendee only)

PUT /api/events/update/:id - Update event (organizer only)

DELETE /api/events/:id - Delete event (organizer only)

GET /api/events/part - Get events a user has registered for (attendee only)

Testing
Tests use Jest, Supertest, and mongodb-memory-server for in-memory database testing.

Run tests with:
npm run test 

Folder Structure

├── controllers/    # Route handlers
├── middlewares/    # Auth and role middlewares
├── models/         # Mongoose models
├── routes/         # Express routers
├── tests/          # Jest test files
├── utils/          # Utility functions (email, etc.)
├── .env            # Environment variables
├── server.js       # Entry point


# Synapse Backend API

Production-ready backend for the Synapse collaboration platform.

## Features

- ✅ User authentication (JWT)
- ✅ User profiles & search
- ✅ Posts with comments & likes
- ✅ Teams & invitations
- ✅ Event management
- ✅ Real-time notifications
- ✅ Security (Helmet, Rate Limiting, Sanitization)
- ✅ Pagination
- ✅ Database indexing

## Prerequisites

- Node.js (v14+)
- MongoDB (v4+)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/synapse
JWT_SECRET=your_secret_key_here
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get current user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)
- `PUT /api/users/profile-pic` - Update profile picture (Protected)
- `PUT /api/users/banner-pic` - Update banner picture (Protected)
- `GET /api/users/search?q=query` - Search users (Protected)
- `GET /api/users/:username` - Get user by username
- `GET /api/users/:id/stats` - Get user statistics
- `PUT /api/users/:id/follow` - Follow/Unfollow user (Protected)

### Posts
- `GET /api/posts?pageNumber=1` - Get all posts (Protected, Paginated)
- `POST /api/posts` - Create post (Protected)
- `DELETE /api/posts/:id` - Delete post (Protected)
- `PUT /api/posts/:id/like` - Like/Unlike post (Protected)
- `POST /api/posts/:id/comments` - Add comment (Protected)
- `DELETE /api/posts/:id/comments/:commentId` - Delete comment (Protected)

### Teams
- `GET /api/teams` - Get user's teams (Protected)
- `POST /api/teams` - Create team (Protected)
- `GET /api/teams/search?q=query` - Search teams (Protected)
- `GET /api/teams/:id` - Get team by ID (Protected)
- `PUT /api/teams/:id/join` - Join team (Protected)
- `PUT /api/teams/:id/leave` - Leave team (Protected)
- `POST /api/teams/:id/invite` - Invite user to team (Protected)

### Events
- `GET /api/events?pageNumber=1` - Get all events (Protected, Paginated)
- `POST /api/events` - Create event (Protected)
- `PUT /api/events/:id/join` - Join event (Protected)
- `PUT /api/events/:id/leave` - Leave event (Protected)

### Notifications
- `GET /api/notifications` - Get user notifications (Protected)
- `PUT /api/notifications/:id/read` - Mark notification as read (Protected)

## Security Features

- **Helmet**: Secure HTTP headers
- **Rate Limiting**: 100 requests per 10 minutes per IP
- **Data Sanitization**: Protection against NoSQL injection and XSS
- **HPP**: HTTP Parameter Pollution prevention
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds

## Database Indexes

The following indexes are configured for optimal query performance:

- **Users**: email, username, followers, following
- **Posts**: user, createdAt, likes
- **Teams**: members, leader
- **Events**: date, organizer, attendees
- **Notifications**: recipient+read, createdAt

## Project Structure

```
synapse-backend/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js      # Authentication logic
│   ├── userController.js      # User management
│   ├── postController.js      # Post management
│   ├── teamController.js      # Team management
│   ├── eventController.js     # Event management
│   └── notificationController.js  # Notifications
├── middleware/
│   ├── authMiddleware.js      # JWT verification
│   └── validate.js            # Joi validation
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Team.js
│   ├── Event.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── postRoutes.js
│   ├── teamRoutes.js
│   ├── eventRoutes.js
│   └── notificationRoutes.js
├── utils/
│   ├── generateToken.js       # JWT token generation
│   └── validationSchemas.js   # Joi schemas
├── uploads/                   # File uploads
├── .env                       # Environment variables
├── .env.example               # Environment template
└── server.js                  # Entry point
```

## Error Handling

All errors return JSON in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "stack": "Stack trace (development only)"
}
```

## License

MIT

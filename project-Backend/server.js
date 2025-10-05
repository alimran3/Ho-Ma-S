const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Route imports
const instituteRoutes = require('./routes/institute');
const authRoutes = require('./routes/auth');
const ownerRoutes = require('./routes/owner');
const hallRoutes = require('./routes/halls');
const managersRoutes = require('./routes/managers');
const floorRoutes = require('./routes/floors');
const roomRoutes = require('./routes/rooms');
const managerRoutes = require('./routes/manager');
const studentRoutes = require('./routes/student');
const guestRoutes = require('./routes/guest');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/institute', instituteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/halls', hallRoutes);
app.use('/api/managers', managersRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/guest', guestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
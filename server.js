const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible in controllers
app.set('io', io);

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/revenue', require('./routes/revenueRoutes'));

app.get('/', (req, res) => {
  res.send('Seedha Order Backend is running successfully! 🚀');
});

// Socket.io — drivers join a room by their userId
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`🔌 Driver ${userId} connected`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`=================================`);
});

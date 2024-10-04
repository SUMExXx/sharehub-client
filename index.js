const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/userRoutes');
const { initRoot } = require('./utils/initialization');

const userData = require('./data/userData.json');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs
});

var app = express()

// app.use(limiter);

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

// app.use((err, req, res, next) => {
//   if (err instanceof RateLimitError) {
//     res.status(429).json({ error: 'Rate limit exceeded' });
//   } else {
//     next();
//   }
// });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allow specified methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow specified headers
  res.setHeader('Access-Control-Allow-Credentials', true); // Allow credentials
  next();
});

const port = process.env.PORT || 8080;

app.use('/users', userRoutes);

initRoot(userData.user.user_id);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
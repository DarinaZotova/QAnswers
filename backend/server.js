// backend/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middlewares/error');
const profileRoutes = require('./routes/profile.routes'); //




const app = express();

app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,              
}));

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOADS_DIR || 'uploads')));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth.routes'));

app.use('/api/users', require('./routes/users.routes'));

app.use('/api/posts', require('./routes/posts.routes'));

app.use('/api/categories', require('./routes/categories.routes'));

app.use('/api/comments', require('./routes/comments.routes'));

app.use('/api/admin', require('./routes/admin.routes'));

app.use('/api/me', require('./routes/me.routes'));

app.use('/api/profile', profileRoutes);//

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

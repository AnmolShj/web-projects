const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));  // Serve frontend files

// Fake user DB
const users = [{id: 1, username: 'admin', password: 'password123'}];

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username &amp;&amp; u.password === password);
  
  if (user) {
    res.json({ success: true, user: { id: user.id, username } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Tasks endpoint (protected in real app)
app.get('/api/tasks', (req, res) => {
  res.json([
    { id: 1, title: 'Deploy to AWS', completed: false },
    { id: 2, title: 'Build ETL pipeline', completed: true }
  ]);
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});


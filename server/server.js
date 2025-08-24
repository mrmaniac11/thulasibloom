require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const CryptoJS = require('crypto-js');
const nodemailer = require('nodemailer');


const SECRET_KEY = 'thulasibloom-secret-key-2024';

const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Database setup
const db = new sqlite3.Database('./thulasibloom.db');

// Initialize database tables
db.serialize(() => {
  // Cart items table
  db.run(`CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    weight TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER DEFAULT 1,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add image column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE cart_items ADD COLUMN image TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    total_amount REAL NOT NULL,
    order_items TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  




  // Notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // User addresses table
  db.run(`CREATE TABLE IF NOT EXISTS user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    landmark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add phone column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE user_addresses ADD COLUMN phone TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Email queue table
  db.run(`CREATE TABLE IF NOT EXISTS email_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME
  )`);
});

// Address Routes
app.post('/api/addresses', (req, res) => {
  const { userId, name, phone, addressLine1, addressLine2, city, state, pincode, landmark } = req.body;
  
  if (!userId || !name || !phone || !addressLine1 || !city || !state || !pincode) {
    res.status(400).json({ error: 'Required fields missing' });
    return;
  }
  
  db.run(`INSERT INTO user_addresses (user_id, name, phone, address_line1, address_line2, city, state, pincode, landmark) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, phone, addressLine1, addressLine2 || null, city, state, pincode, landmark || null], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Address saved', id: this.lastID });
    }
  );
});

app.get('/api/addresses/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY created_at DESC', 
    [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});



// Email order endpoint
app.post('/api/send-order-email', (req, res) => {
  const { customer, items, total, message } = req.body;
  
  const subject = `New Order from ${customer.name} - ThulasiBloom`;
  const emailBody = message || `New order received from ${customer.name}`;
  
  // Add to email queue
  db.run(`INSERT INTO email_queue (to_email, subject, body) VALUES (?, ?, ?)`,
    ['mrmaniacpersonal@gmail.com', subject, emailBody], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, message: 'Order queued for email delivery' });
    }
  );
});

// Address validation endpoint
app.post('/api/validate-address', (req, res) => {
  res.json({ success: true, message: 'Address validation endpoint' });
});

// Cart Routes
app.get('/api/cart', (req, res) => {
  db.all('SELECT * FROM cart_items ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/cart', (req, res) => {
  const { product_id, product_name, weight, price, quantity = 1, image } = req.body;
  
  // Validate required fields
  if (!product_id || !product_name || !weight || !price) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  if (quantity < 1) {
    res.status(400).json({ error: 'Quantity must be at least 1' });
    return;
  }
  
  // Check if item already exists
  db.get('SELECT * FROM cart_items WHERE product_id = ? AND weight = ?', 
    [product_id, weight], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      // Update quantity
      db.run('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, row.id], (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Cart updated', id: row.id });
      });
    } else {
      // Insert new item
      db.run('INSERT INTO cart_items (product_id, product_name, weight, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
        [product_id, product_name, weight, price, quantity, image], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Item added to cart', id: this.lastID });
      });
    }
  });
});

app.put('/api/cart/:id', (req, res) => {
  const { quantity } = req.body;
  const { id } = req.params;
  
  if (quantity < 1) {
    res.status(400).json({ error: 'Quantity must be at least 1' });
    return;
  }
  
  db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Cart item updated' });
  });
});

app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM cart_items WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Item removed from cart' });
  });
});

app.delete('/api/cart', (req, res) => {
  db.run('DELETE FROM cart_items', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Cart cleared' });
  });
});

// Order Routes
app.post('/api/orders', (req, res) => {
  const { customer, items, total } = req.body;
  
  try {
    const decryptedCustomer = {
      name: customer.name,
      email: decryptData(customer.email),
      phone: decryptData(customer.phone),
      address: decryptData(customer.address)
    };
    
    if (!decryptedCustomer.name || !decryptedCustomer.email || !decryptedCustomer.phone || !decryptedCustomer.address) {
      res.status(400).json({ error: 'All customer details are required' });
      return;
    }
  
    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Order must contain items' });
      return;
    }
  
    db.run(`INSERT INTO orders (customer_name, customer_email, customer_phone, customer_address, total_amount, order_items) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [decryptedCustomer.name, decryptedCustomer.email, decryptedCustomer.phone, decryptedCustomer.address, total, JSON.stringify(items)], 
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Order placed successfully', orderId: this.lastID });
      }
    );
  } catch (error) {
    res.status(400).json({ error: 'Invalid encrypted data' });
  }
});

app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const orders = rows.map(row => ({
      ...row,
      order_items: JSON.parse(row.order_items)
    }));
    res.json(orders);
  });
});

// Notification Routes
app.post('/api/notify', (req, res) => {
  const { product_id, product_name, email, phone } = req.body;
  
  if (!product_id || !product_name) {
    res.status(400).json({ error: 'Product ID and name are required' });
    return;
  }
  
  if (!email && !phone) {
    res.status(400).json({ error: 'Email or phone number is required' });
    return;
  }
  
  // Basic email validation
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  
  // Basic phone validation
  if (phone && !/^[\d\s\-\+\(\)]{10,}$/.test(phone)) {
    res.status(400).json({ error: 'Invalid phone format' });
    return;
  }
  
  db.run('INSERT INTO notifications (product_id, product_name, email, phone) VALUES (?, ?, ?, ?)',
    [product_id, product_name, email || null, phone || null], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Notification request saved', id: this.lastID });
  });
});

app.get('/api/notifications', (req, res) => {
  db.all('SELECT * FROM notifications ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ThulasiBloom server is running' });
});

// Database connection error handling
db.on('error', (err) => {
  console.error('Database error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});



// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Email queue processor
const processEmailQueue = async () => {
  db.all(`SELECT * FROM email_queue WHERE status = 'pending' AND attempts < 3 ORDER BY created_at ASC LIMIT 5`, 
    async (err, emails) => {
      if (err || !emails.length) return;
      
      for (const email of emails) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || 'noreply@thulasibloom.com',
            to: email.to_email,
            subject: email.subject,
            text: email.body
          });
          
          db.run(`UPDATE email_queue SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?`, 
            [email.id]);
          console.log(`Email sent to ${email.to_email}`);
        } catch (error) {
          console.error(`Email failed for ${email.to_email}:`, error.message);
          db.run(`UPDATE email_queue SET attempts = attempts + 1 WHERE id = ?`, [email.id]);
        }
      }
    }
  );
};

// Process email queue every 5 seconds
setInterval(processEmailQueue, 5000);

app.listen(PORT, () => {
  console.log(`ThulasiBloom server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('Email queue processor started');
});
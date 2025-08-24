const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const CryptoJS = require('crypto-js');

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
    payment_method TEXT DEFAULT 'cod',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add payment_method column if it doesn't exist
  db.run(`ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cod'`, (err) => {
    // Ignore error if column already exists
  });
  
  // Add payment_id column if it doesn't exist
  db.run(`ALTER TABLE orders ADD COLUMN payment_id TEXT`, (err) => {
    // Ignore error if column already exists
  });

// Address validation endpoint
const { validateAddress } = require('./validators/addressValidator');

app.post('/api/validate-address', (req, res) => {
  const validation = validateAddress(req.body);
  
  if (validation.isValid) {
    res.json({ success: true, message: 'Address is valid' });
  } else {
    res.status(400).json({ success: false, errors: validation.errors });
  }
});

// Email order endpoint
app.post('/api/send-order-email', (req, res) => {
  const { customer, items, total, paymentMethod, orderDate } = req.body;
  
  const orderDetails = `
New Order from ThulasiBloom Website

Customer Details:
Name: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}

Delivery Address:
${customer.addressLine1}
${customer.addressLine2}
${customer.city}, ${customer.state}
Pincode: ${customer.pincode}
Landmark: ${customer.landmark}

Order Items:
${items.map(item => `${item.name} (${item.weight}) x ${item.quantity} = ₹${item.price * item.quantity}`).join('\n')}

Total Amount: ₹${total}
Payment Method: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
Delivery: By Courier

Order Date: ${new Date(orderDate).toLocaleString()}

Please contact the customer to confirm the order.
  `;
  
  console.log('Order Email Details:', orderDetails);
  
  // In a real app, you would send email here using nodemailer or similar
  // For now, just log and return success
  res.json({ success: true, message: 'Order details logged for manual processing' });
});

  // Notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
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
  const { customer, items, total, paymentMethod = 'cod', paymentId } = req.body;
  
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
  
    db.run(`INSERT INTO orders (customer_name, customer_email, customer_phone, customer_address, total_amount, order_items, payment_method, payment_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [decryptedCustomer.name, decryptedCustomer.email, decryptedCustomer.phone, decryptedCustomer.address, total, JSON.stringify(items), paymentMethod, paymentId], 
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

app.listen(PORT, () => {
  console.log(`ThulasiBloom server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
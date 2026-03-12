
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

dotenv.config();
const PORT = process.env.PORT || 4000;
const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'tsm.sqlite3');

// ensure data dir
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_FILE);

// initialize tables
db.prepare(`CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT, description TEXT, price INTEGER, category TEXT, stock INTEGER, image TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, customer_name TEXT, phone TEXT, address TEXT, items TEXT, subtotal INTEGER, total INTEGER, status TEXT, created_at TEXT, upi_ref TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY AUTOINCREMENT, passhash TEXT)`).run();
// seed admin password (if empty)
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';
const row = db.prepare('SELECT count(*) as c FROM admin').get();
if (row.c === 0) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(ADMIN_PASS, salt);
  db.prepare('INSERT INTO admin (passhash) VALUES (?)').run(hash);
}

// seed demo products if empty
const cnt = db.prepare('SELECT count(*) as c FROM products').get();
if (cnt.c === 0) {
  const sample = [
    ['c1','Sparkle Fountain (Small)','Safe short-duration fountain. Great for small gatherings.',120,'fountains',25,'/assets/p1.png'],
    ['c2','Skyburst Rockets (Pack of 6)','High-flying rockets for a dramatic burst in the sky.',450,'rockets',10,'/assets/p2.png'],
    ['c3','Whistling Spinner','Colorful spinning wheel with whistling effect.',80,'ground',40,'/assets/p3.png'],
    ['c4','Roman Candles (Pack of 4)','Classic roman candles with multi-color shots.',260,'candles',18,'/assets/p4.png'],
    ['c5','Assorted Crackers Combo','A safe assortment — ideal for family celebrations.',199,'combos',50,'/assets/p5.png']
  ];
  const stmt = db.prepare('INSERT INTO products (id,name,description,price,category,stock,image) VALUES (?,?,?,?,?,?,?)');
  const insertMany = db.transaction((rows) => {
    for (const r of rows) stmt.run(...r);
  });
  insertMany(sample);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// API routes
app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products').all();
  res.json(rows);
});

app.post('/api/orders', (req, res) => {
  const id = 'ORD' + Date.now();
  const { customer_name, phone, address, items, subtotal, total, upi_ref } = req.body;
  const created_at = new Date().toISOString();
  db.prepare('INSERT INTO orders (id,customer_name,phone,address,items,subtotal,total,status,created_at,upi_ref) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, customer_name, phone, address, JSON.stringify(items), subtotal, total, 'pending', created_at, upi_ref || '');
  // reduce stock (best-effort)
  const it = JSON.parse(JSON.stringify(items || []));
  const update = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  for (const p of it) {
    try { update.run(p.qty || 1, p.id); } catch(e){}
  }
  res.json({ ok: true, id });
});

app.get('/api/orders', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const row = db.prepare('SELECT passhash FROM admin LIMIT 1').get();
  if (!row) return res.status(500).json({ error: 'admin not set' });
  const ok = bcrypt.compareSync(password || '', row.passhash);
  if (!ok) return res.status(401).json({ error: 'invalid' });
  // return a simple session token (demo only)
  const token = 'admintoken:' + Date.now();
  res.json({ ok: true, token });
});

app.post('/api/admin/verify', (req, res) => {
  const { id } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('paid', id);
  res.json({ ok: true });
});

// simple search/update product endpoints for admin
app.post('/api/admin/product', (req, res) => {
  const p = req.body;
  db.prepare('INSERT OR REPLACE INTO products (id,name,description,price,category,stock,image) VALUES (?,?,?,?,?,?,?)')
    .run(p.id || ('p'+Date.now()), p.name, p.description, p.price, p.category, p.stock, p.image || '/assets/p1.png');
  res.json({ ok: true });
});

const port = PORT;
app.listen(port, () => console.log('Backend listening on', port));

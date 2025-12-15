const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Membuat/mendapatkan keranjang aktif untuk pembeli.
async function ensureCart(conn, pembeliId) {
  const [c] = await conn.query('SELECT keranjang_id FROM keranjang WHERE pembeli_id=? LIMIT 1', [pembeliId]);
  if (c.length) return c[0].keranjang_id;
  const [r] = await conn.query('INSERT INTO keranjang (pembeli_id) VALUES (?)', [pembeliId]);
  return r.insertId;
}

router.get('/carts', requireAuth, requireRole(['pembeli']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const cartId = await ensureCart(conn, req.user.id);
    const [items] = await conn.query(
      'SELECT i.item_id,i.jumlah,p.produk_id,p.nama_produk,p.harga,p.stok,p.penjual_id,COALESCE(u.nama, "Penjual Tidak Dikenal") AS penjual_nama,(i.jumlah*p.harga) AS subtotal FROM keranjang_item i JOIN produk p ON p.produk_id=i.produk_id LEFT JOIN user u ON u.user_id=p.penjual_id AND u.role="penjual" WHERE i.keranjang_id=? AND p.deleted_at IS NULL',
      [cartId]
    );
    const total = items.reduce((s, it) => s + Number(it.subtotal || 0), 0);
    res.json({ keranjang_id: cartId, items, total });
  } finally {
    conn.release();
  }
});

router.post('/carts/items', requireAuth, requireRole(['pembeli']), [
  body('produk_id').isInt({ min: 1 }),
  body('jumlah').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { produk_id, jumlah } = req.body;
  const conn = await pool.getConnection();
  try {
    const cartId = await ensureCart(conn, req.user.id);
    const [exists] = await conn.query('SELECT item_id,jumlah FROM keranjang_item WHERE keranjang_id=? AND produk_id=? LIMIT 1', [cartId, produk_id]);
    if (exists.length) {
      const newQty = Number(exists[0].jumlah) + Number(jumlah);
      await conn.query('UPDATE keranjang_item SET jumlah=? WHERE item_id=?', [newQty, exists[0].item_id]);
      return res.status(200).json({ item_id: exists[0].item_id, jumlah: newQty });
    }
    const [r] = await conn.query('INSERT INTO keranjang_item (keranjang_id,produk_id,jumlah) VALUES (?,?,?)', [cartId, produk_id, jumlah]);
    res.status(201).json({ item_id: r.insertId });
  } finally {
    conn.release();
  }
});

router.delete('/carts/items/:itemId', requireAuth, requireRole(['pembeli']), [
  param('itemId').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    const cartId = await ensureCart(conn, req.user.id);
    await conn.query('DELETE FROM keranjang_item WHERE item_id=? AND keranjang_id=?', [req.params.itemId, cartId]);
    res.json({ ok: true });
  } finally {
    conn.release();
  }
});

module.exports = router;
router.patch('/carts/items/:itemId', requireAuth, requireRole(['pembeli']), [
  param('itemId').isInt({ min: 1 }),
  body('jumlah').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { jumlah } = req.body;
  const conn = await pool.getConnection();
  try {
    const cartId = await ensureCart(conn, req.user.id);
    const [it] = await conn.query('SELECT item_id FROM keranjang_item WHERE item_id=? AND keranjang_id=? LIMIT 1', [req.params.itemId, cartId]);
    if (!it.length) return res.status(404).json({ error: 'not_found' });
    await conn.query('UPDATE keranjang_item SET jumlah=? WHERE item_id=?', [jumlah, req.params.itemId]);
    res.json({ ok: true });
  } finally {
    conn.release();
  }
});

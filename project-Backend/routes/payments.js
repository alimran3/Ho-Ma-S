const express = require('express');
const router = express.Router();
const https = require('https');
const querystring = require('querystring');
const { auth } = require('../Middleware/auth');
const Student = require('../models/Student');
const Payment = require('../models/Payment');

const SSLZ_API_INIT = process.env.SSLCZ_INIT_URL || 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
const SSLZ_VALIDATION_URL = process.env.SSLCZ_VALIDATION_URL || 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';
const STORE_ID = process.env.SSLCZ_STORE_ID || 'your_store_id';
const STORE_PASSWD = process.env.SSLCZ_STORE_PASSWD || 'your_store_passwd';
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:5173';
const BACKEND_BASE = process.env.BACKEND_BASE || 'http://localhost:5000';

function postForm(urlString, data) {
  return new Promise((resolve, reject) => {
    const payload = querystring.stringify(data);
    const url = new URL(urlString);
    const options = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

router.post('/init', auth, async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || Number(amount) < 10) return res.status(400).json({ message: 'Invalid amount (minimum 10 BDT)' });

    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const tran_id = `TXN_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    const success_url = `${BACKEND_BASE}/api/payment/success`;
    const fail_url = `${BACKEND_BASE}/api/payment/fail`;
    const cancel_url = `${BACKEND_BASE}/api/payment/cancel`;

    const payload = {
      store_id: STORE_ID,
      store_passwd: STORE_PASSWD,
      total_amount: Number(amount),
      currency: 'BDT',
      tran_id,
      success_url,
      fail_url,
      cancel_url,
      ipn_url: `${BACKEND_BASE}/api/payment/ipn`,
      cus_name: student.fullName || 'Student',
      cus_email: student.email || 'no@email.com',
      cus_add1: student.address || 'N/A',
      cus_city: 'N/A',
      cus_postcode: '0000',
      cus_country: 'Bangladesh',
      cus_phone: student.phone || '00000000000',
      product_name: 'Mess Bill',
      product_category: 'Services',
      product_profile: 'general',
      shipping_method: 'NO',
      num_of_item: 1,
    };

    // Preselect payment channel optionally
    const allowedMethods = ['bkash','nagad','visa','master','amex','qcash','upay','city','dbbl'];
    if (method && allowedMethods.includes(String(method).toLowerCase())) {
      payload.multi_card_name = String(method).toLowerCase();
    }

    // Create payment doc
    const payment = await Payment.create({ studentId: student._id, amount: Number(amount), tran_id, status: 'pending' });

    // MOCK mode to bypass gateway while store is inactive
    if (process.env.SSLCZ_MOCK === 'true') {
      payment.status = 'success';
      await payment.save();
      return res.json({ url: `${FRONTEND_BASE}/payment/success?tran_id=${encodeURIComponent(tran_id)}`, tran_id, mock: true });
    }

    const response = await postForm(SSLZ_API_INIT, payload);
    if (response?.status === 'SUCCESS' && response.GatewayPageURL) {
      payment.sessionKey = response.sessionkey || response.sessionKey;
      await payment.save();
      return res.json({ url: response.GatewayPageURL, tran_id });
    }

    return res.status(502).json({ message: 'SSLCommerz init failed', detail: response });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/success', async (req, res) => {
  try {
    const { val_id, tran_id } = req.body || {};
    if (!tran_id) return res.redirect(`${FRONTEND_BASE}/?payment=failed`);
    const payment = await Payment.findOne({ tran_id });
    if (!payment) return res.redirect(`${FRONTEND_BASE}/?payment=failed`);

    // Validate with SSLCommerz
    const url = `${SSLZ_VALIDATION_URL}?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(STORE_ID)}&store_passwd=${encodeURIComponent(STORE_PASSWD)}&format=json`;
    const result = await new Promise((resolve, reject) => {
      https.get(url, (res2) => {
        let data = '';
        res2.on('data', (chunk) => data += chunk);
        res2.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
        });
      }).on('error', reject);
    });

    payment.status = 'success';
    payment.val_id = val_id;
    payment.gatewayResponse = result;
    await payment.save();

    return res.redirect(`${FRONTEND_BASE}/payment/success?tran_id=${encodeURIComponent(tran_id)}`);
  } catch (error) {
    return res.redirect(`${FRONTEND_BASE}/payment/fail`);
  }
});

router.post('/fail', async (req, res) => {
  try {
    const { tran_id } = req.body || {};
    if (tran_id) await Payment.findOneAndUpdate({ tran_id }, { $set: { status: 'failed', gatewayResponse: req.body } });
  } catch {}
  return res.redirect(`${FRONTEND_BASE}/payment/fail`);
});

router.post('/cancel', async (req, res) => {
  try {
    const { tran_id } = req.body || {};
    if (tran_id) await Payment.findOneAndUpdate({ tran_id }, { $set: { status: 'cancelled', gatewayResponse: req.body } });
  } catch {}
  return res.redirect(`${FRONTEND_BASE}/payment/cancel`);
});

// IPN handler
router.post('/ipn', async (req, res) => {
  try {
    const { tran_id } = req.body || {};
    if (!tran_id) return res.status(400).json({ message: 'No tran_id' });
    await Payment.findOneAndUpdate({ tran_id }, { $set: { gatewayResponse: req.body } });
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

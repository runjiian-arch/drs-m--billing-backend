import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import admin from "firebase-admin";

// --- Load environment variables ---
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Initialize Firebase ---
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// --- Default route ---
app.get("/", (req, res) => {
  res.send("DRS Billing System Backend is running ✅");
});

// --- User registration ---
app.post("/register", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const userRef = db.collection("users").doc(email);
    await userRef.set({ name, email, phone, createdAt: Date.now() });
    res.status(200).json({ message: "User registered successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Create a package ---
app.post("/package", async (req, res) => {
  try {
    const { name, price, speed, time, type } = req.body;
    const pkgRef = db.collection("packages").doc();
    await pkgRef.set({ name, price, speed, time, type, createdAt: Date.now() });
    res.status(200).json({ message: "Package created ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Fetch all packages ---
app.get("/packages", async (req, res) => {
  try {
    const snapshot = await db.collection("packages").get();
    const packages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Create voucher ---
app.post("/voucher", async (req, res) => {
  try {
    const { code, packageId } = req.body;
    const voucherRef = db.collection("vouchers").doc(code);
    await voucherRef.set({ code, packageId, used: false, createdAt: Date.now() });
    res.status(200).json({ message: "Voucher created ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Redeem voucher ---
app.post("/redeem", async (req, res) => {
  try {
    const { code, user } = req.body;
    const voucherRef = db.collection("vouchers").doc(code);
    const doc = await voucherRef.get();

    if (!doc.exists) return res.status(404).
return res.status(404).json({ error: "Voucher not found ❌" });

    const voucher = doc.data();
    if (voucher.used)
      return res.status(400).json({ error: "Voucher already used ⚠️" });

    await voucherRef.update({
      used: true,
      usedBy: user,
      usedAt: Date.now(),
    });

    res
    res.status(200).json({ message: "Voucher redeemed successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Payments record ---
app.post("/payment", async (req, res) => {
  try {
    const { user, amount, method } = req.body;
    const paymentRef = db.collection("payments").doc();
    await paymentRef.set({
      user,
      amount,
      method,
      createdAt: Date.now(),
    });
    res.status(200).json({ message: "Payment recorded ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Smart TV packages (similar to
// --- Smart TV packages (same logic as phone packages) ---
app.post("/smarttv/package", async (req, res) => {
  try {
    const { name, price, speed, time } = req.body;
    const tvRef = db.collection("smarttv_packages").doc();
    await tvRef.set({ name, price, speed, time, type: "Smart TV", createdAt: Date.now() });
    res.status(200).json({ message: "Smart TV package created ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Fetch Smart TV packages ---
app.get("/smarttv/packages", async (req, res) => {
  try {
    const snapshot = await db.collection("smarttv_packages").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reports summary ---
app.get("/reports/summary", async (req, res) => {
  try {
    const paymentsSnap = await db.collection("payments").get();
    const usersSnap = await db.collection("users").get();
    const vouchersSnap = await db.collection("vouchers").get();

    const totalEarnings = paymentsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 
0), 0);

    res.status(200).json({
      users: usersSnap.size,
      vouchers: vouchersSnap.size,
      totalEarnings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start the server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 DRS Billing System Backend running on port ${PORT}`);
});

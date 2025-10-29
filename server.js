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

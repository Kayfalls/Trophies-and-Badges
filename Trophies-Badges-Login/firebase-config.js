// ============================================================
// FIREBASE CONFIG — Trophies-Badges-Login (Customer App)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCYueex-c-uw--YQakHJqqs5F2rgxah2wQ",
  authDomain: "trophies-badges.firebaseapp.com",
  projectId: "trophies-badges",
  storageBucket: "trophies-badges.firebasestorage.app",
  messagingSenderId: "894252530838",
  appId: "1:894252530838:web:af8ede8f6b2b8af96316b7",
  measurementId: "G-B251Q4YNM8"
};

firebase.initializeApp(firebaseConfig);

const db      = firebase.firestore();
const auth    = firebase.auth();
const storage = firebase.storage();



// ── EmailJS Configuration ─────────────────────────────────────
const EMAILJS_CONFIG = {
  PUBLIC_KEY:  'Nq5Ec_VvBWCIMm6LF',
  SERVICE_ID:  'service_i6xp00f',
  TEMPLATE_ID: 'template_rbzhgms'
};

// ── Business Info ─────────────────────────────────────────────
const BUSINESS_INFO = {
  name:     'Trophies & Badges',
  address:  'Trade Route Mall, Cnr Nirvana Rd & K43, Lenasia Ext. 9',
  phone1:   '+27 83 767 6746',
  phone2:   '+27 81 752 4685',
  email:    'trophies.badges@gmail.com',
  whatsapp: '27837676746'
};

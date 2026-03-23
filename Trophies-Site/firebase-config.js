// ============================================================
// FIREBASE CONFIG — shared by Trophies-Site (Admin App)
// Same Firebase project as Trophies-Badges-Login (Customer App)
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

const ADMIN_EMAIL = "trophies.badges@gmail.com";

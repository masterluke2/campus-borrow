import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDOHMr4JOstKPz6wgDWlLL3axaH6C90bSw",
  authDomain: "campus-borrow.firebaseapp.com",
  projectId: "campus-borrow",
  storageBucket: "campus-borrow.firebasestorage.app",
  messagingSenderId: "32572417511",
  appId: "1:32572417511:web:1aa3a5f207e41dcb7f8942"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);      
export const db = getFirestore(app);   
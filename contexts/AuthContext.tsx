import {
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import React, {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';
import { auth, db } from '../firebaseConfig';

type UserProfile = {
  displayName: string;
  email: string;
  avatarBase64?: string | null;
  points?: number;          
  createdAt?: any;
  updatedAt?: any;
};

type FullProfile = UserProfile & { id: string };

type AuthContextType = {
  user: User | null;
  profile: FullProfile | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setProfile({ id: snap.id, ...(snap.data() as UserProfile) });
        } else {
          const profileData: UserProfile = {
            email: firebaseUser.email || '',
            displayName:
              firebaseUser.email?.split('@')[0] || 'Borrower',
            avatarBase64: null,
            points: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, profileData);
          setProfile({ id: userRef.id, ...profileData });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setInitializing(false);
    });

    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userRef = doc(db, 'users', cred.user.uid);
    const profileData: UserProfile = {
      email,
      displayName,
      avatarBase64: null,
      points: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, profileData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, initializing, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
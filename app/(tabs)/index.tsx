import { LinearGradient } from 'expo-linear-gradient';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CategoryChips from '../../components/CategoryChips';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebaseConfig';

type Item = {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'reserved';
  categoryId?: string;
};

type Category = { id: string; name: string };

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [myRequestsCount, setMyRequestsCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Item[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Item, 'id'>),
      }));
      setItems(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Category[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Category, 'id'>),
      }));
      setCategories(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setMyRequestsCount(0);
      return;
    }
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMyRequestsCount(snap.size);
    });
    return () => unsub();
  }, [user]);

const seedItems = async () => {
  const camerasRef = doc(db, 'categories', 'cameras');
  const projectorsRef = doc(db, 'categories', 'projectors');
  const laptopsRef = doc(db, 'categories', 'laptops');
  const audioRef = doc(db, 'categories', 'audio');

  await Promise.all([
    setDoc(
      camerasRef,
      {
        name: 'Cameras',
        description: 'Photo and video cameras',
      },
      { merge: true }
    ),
    setDoc(
      projectorsRef,
      {
        name: 'Projectors',
        description: 'Projectors and screens',
      },
      { merge: true }
    ),
    setDoc(
      laptopsRef,
      {
        name: 'Laptops',
        description: 'Portable computers for projects',
      },
      { merge: true }
    ),
    setDoc(
      audioRef,
      {
        name: 'Audio',
        description: 'Microphones, speakers and recorders',
      },
      { merge: true }
    ),
  ]);

  const itemsCol = collection(db, 'items');

  const samples = [
    {
      id: 'canon-dslr',
      name: 'Canon DSLR Camera',
      description: '18-55mm kit lens',
      categoryId: camerasRef.id,
    },
    {
      id: 'sony-mirrorless',
      name: 'Sony Mirrorless Camera',
      description: '4K video, 35mm prime lens',
      categoryId: camerasRef.id,
    },
    {
      id: 'hd-projector',
      name: 'HD Projector',
      description: '1080p projector with HDMI input',
      categoryId: projectorsRef.id,
    },
    {
      id: 'macbook-pro-13',
      name: 'MacBook Pro 13"',
      description: 'For editing and programming',
      categoryId: laptopsRef.id,
    },
    {
      id: 'dell-xps-15',
      name: 'Dell XPS 15',
      description: 'Powerful Windows laptop',
      categoryId: laptopsRef.id,
    },
    {
      id: 'podcast-mic-kit',
      name: 'Podcast Microphone Kit',
      description: 'USB mic with boom arm',
      categoryId: audioRef.id,
    },
  ];

  await Promise.all(
    samples.map((s) =>
      setDoc(
        doc(itemsCol, s.id),
        {
          name: s.name,
          description: s.description,
          categoryId: s.categoryId,
          status: 'available',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    )
  );

  Alert.alert('Done', 'Sample items are now available.');
};

  const requestBorrow = async (item: Item) => {
    if (!user) {
      Alert.alert('Not logged in', 'Please log in first.');
      return;
    }

    try {
      const result = await runTransaction(db, async (tx) => {
        const itemRef = doc(db, 'items', item.id);
        const itemSnap = await tx.get(itemRef);
        if (!itemSnap.exists()) throw new Error('Item not found');

        const data = itemSnap.data() as Omit<Item, 'id'>;
        if (data.status !== 'available') {
          throw new Error('Item is no longer available.');
        }

        tx.update(itemRef, {
          status: 'reserved',
          updatedAt: serverTimestamp(),
        });

        const txRef = doc(collection(db, 'transactions'));
        tx.set(txRef, {
          userId: user.uid,
          itemId: item.id,
          status: 'pending',
          requestedAt: serverTimestamp(),
          approvedAt: null,
          borrowedAt: null,
          returnedAt: null,
          cancelledAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return { transactionId: txRef.id, itemName: data.name };
      });

      await Promise.all([
        addDoc(collection(db, 'activityLogs'), {
          type: 'TRANSACTION_CREATED',
          userId: user.uid,
          itemId: item.id,
          transactionId: result.transactionId,
          metadata: { status: 'pending' },
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          transactionId: result.transactionId,
          title: 'Borrow request created',
          body: `You requested to borrow ${result.itemName}.`,
          read: false,
          createdAt: serverTimestamp(),
        }),
      ]);

      Alert.alert(
        'Request sent',
        'Nice choice. You can track it in My Transactions.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text }}>
          Loading items...
        </Text>
      </View>
    );
  }

  const greetingName =
    profile?.displayName || profile?.email || 'Borrower';
  const points = profile?.points ?? 0;

  const filteredItems =
    selectedCategoryId == null
      ? items
      : items.filter((i) => i.categoryId === selectedCategoryId);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.backgroundAlt,
      }}
    >
      <LinearGradient
        colors={theme.colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={[styles.appName, { color: theme.colors.muted }]}>
          CampusBorrow
        </Text>
        <Text style={[styles.greeting, { color: '#f9fafb' }]}>
          Hi, {greetingName}
        </Text>
        <Text style={[styles.subtext, { color: '#e5e7eb' }]}>
          You&apos;ve made {myRequestsCount} borrow request
          {myRequestsCount === 1 ? '' : 's'} and earned {points} points.
        </Text>
      </LinearGradient>

      <View
        style={[
          styles.content,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {categories.length > 0 && (
          <CategoryChips
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        )}

        {items.length === 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{ marginBottom: 8, color: theme.colors.text }}
            >
              The shelf is empty. Add some sample items to start
              playing with the app.
            </Text>
            <Button
              title="Add Sample Items"
              onPress={seedItems}
              color={theme.colors.primary}
            />
          </View>
        )}

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.card },
              ]}
            >
              {index === 0 && (
                <Text style={styles.trending}>Trending pick</Text>
              )}
              <Text
                style={[
                  styles.itemName,
                  { color: theme.colors.text },
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.itemDesc,
                  { color: theme.colors.muted },
                ]}
              >
                {item.description}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        item.status === 'available'
                          ? '#22c55e'
                          : '#f97316',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {item.status === 'available'
                    ? 'Available now'
                    : 'Reserved'}
                </Text>
              </View>
              <Button
                title={
                  item.status === 'available'
                    ? 'Request to Borrow'
                    : 'Not available'
                }
                onPress={() => requestBorrow(item)}
                disabled={item.status !== 'available'}
                color={
                  item.status === 'available'
                    ? theme.colors.accent
                    : '#9ca3af'
                }
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  appName: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  greeting: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
  },
  subtext: { marginTop: 4, fontSize: 13 },
  content: {
    flex: 1,
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginTop: -10,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  trending: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    marginBottom: 6,
  },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemDesc: { marginBottom: 6 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: { fontSize: 12, color: '#6b7280' },
});
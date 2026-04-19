import {
    collection,
    doc,
    onSnapshot,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebaseConfig';

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt?: any;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Notification[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Notification, 'id'>),
        }));
        setNotifications(list);
        setLoading(false);
      },
      (error) => {
        console.error('Notifications onSnapshot error:', error);
        Alert.alert('Error', error.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  if (!user) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>
          Please log in to see notifications.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
        <Text style={{ color: theme.colors.text }}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>
          No notifications yet.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: item.read
                  ? theme.colors.card
                  : '#eef6ff',
                borderColor: item.read
                  ? theme.colors.border
                  : '#60a5fa',
              },
            ]}
            onPress={() => markAsRead(item.id)}
          >
            <Text
              style={[
                styles.title,
                { color: theme.colors.text },
              ]}
            >
              {item.title}
            </Text>
            <Text style={{ color: theme.colors.muted }}>
              {item.body}
            </Text>
            {!item.read && (
              <Text style={styles.unreadLabel}>
                Tap to mark as read
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16 },
  card: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  title: { fontWeight: 'bold', marginBottom: 4 },
  unreadLabel: { marginTop: 4, color: '#2563eb', fontSize: 12 },
});
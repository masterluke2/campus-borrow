import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React from 'react';
import {
    Alert,
    Button,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const { user, profile, logout } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();
  const router = useRouter();

  const pickAvatar = async () => {
    if (!user || !profile) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled) return;

    const base64 = result.assets[0].base64 as string;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        avatarBase64: base64,
        updatedAt: serverTimestamp(),
      });
      Alert.alert(
        'Avatar updated',
        'Looking good. It may take a moment to refresh.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user || !profile) {
    return (
      <View style={styles.center}>
        <Text>No profile loaded.</Text>
      </View>
    );
  }

  const points = profile.points ?? 0;
  const level =
    points >= 60
      ? 'Gold Borrower'
      : points >= 30
      ? 'Silver Borrower'
      : points >= 10
      ? 'Bronze Borrower'
      : 'Newbie';
  const nextLevel =
    points >= 60 ? null : points >= 30 ? 60 : points >= 10 ? 30 : 10;

  const achievements = [
    {
      id: 'first',
      title: 'First Borrow',
      desc: 'Complete your first borrowing (10 pts).',
      done: points >= 10,
    },
    {
      id: 'streak',
      title: 'On a Roll',
      desc: 'Complete 3 borrowings (30 pts).',
      done: points >= 30,
    },
    {
      id: 'master',
      title: 'Gear Master',
      desc: 'Complete 6+ borrowings (60 pts).',
      done: points >= 60,
    },
  ];

  return (
    <LinearGradient
      colors={theme.colors.heroGradient}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {profile.avatarBase64 ? (
          <Image
            source={{
              uri: `data:image/jpeg;base64,${profile.avatarBase64}`,
            }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: theme.colors.muted }}>
              Tap below to add
            </Text>
          </View>
        )}

        <Text style={[styles.name, { color: theme.colors.text }]}>
          {profile.displayName}
        </Text>
        <Text style={[styles.email, { color: theme.colors.muted }]}>
          {profile.email}
        </Text>

        <View
          style={[
            styles.pointsCard,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.level, { color: theme.colors.muted }]}>
            {level}
          </Text>
          <Text style={styles.pointsValue}>{points} pts</Text>
          {nextLevel && (
            <Text style={styles.pointsHint}>
              {nextLevel - points} pts until the next rank.
            </Text>
          )}
          {!nextLevel && (
            <Text style={styles.pointsHint}>
              You&apos;ve reached the top rank. Legend!
            </Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text },
            ]}
          >
            Achievements
          </Text>
        </View>

        <FlatList
          data={achievements}
          keyExtractor={(a) => a.id}
          style={{ alignSelf: 'stretch', maxHeight: 180 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.achievement,
                {
                  backgroundColor: item.done
                    ? '#064e3b'
                    : 'rgba(0,0,0,0.25)',
                },
              ]}
            >
              <Text
                style={[
                  styles.achievementTitle,
                  { color: theme.colors.text },
                  item.done && { color: '#22c55e' },
                ]}
              >
                {item.done ? '✓ ' : '• '}
                {item.title}
              </Text>
              <Text
                style={[
                  styles.achievementDesc,
                  { color: theme.colors.muted },
                ]}
              >
                {item.desc}
              </Text>
            </View>
          )}
        />

        <View style={{ height: 12 }} />
        <Button title="Change Avatar" onPress={pickAvatar} />
        <View style={{ height: 12 }} />
        <Button
          title={
            mode === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'
          }
          onPress={toggleTheme}
          color={theme.colors.primary}
        />
        <View style={{ height: 12 }} />
        <Button title="Logout" color="#b91c1c" onPress={handleLogout} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    borderWidth: 1,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  email: { marginBottom: 16 },
  pointsCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  level: { fontSize: 13 },
  pointsValue: {
    color: '#facc15',
    fontSize: 30,
    fontWeight: '800',
    marginVertical: 4,
  },
  pointsHint: { fontSize: 12, textAlign: 'center', color: '#e5e7eb' },
  sectionHeader: {
    alignSelf: 'stretch',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  achievement: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  achievementTitle: {
    fontWeight: '600',
  },
  achievementDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen() {
  const { user, initializing, login } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initializing && user) {
      router.replace('/(tabs)');
    }
  }, [initializing, user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Login error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
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
        <Text style={{ color: theme.colors.text }}>Loading...</Text>
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
      <Text
        style={[
          styles.title,
          { color: theme.colors.text },
        ]}
      >
        CampusBorrow Login
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor={theme.colors.muted}
        secureTextEntry
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={submitting ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={submitting}
        color={theme.colors.primary}
      />

      <View style={{ height: 16 }} />
      <Link
        href="/register"
        style={{ color: theme.colors.primary, textAlign: 'center' }}
      >
        Don&apos;t have an account? Register
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
});
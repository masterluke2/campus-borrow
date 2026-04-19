import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export default function RegisterScreen() {
  const { user, initializing, register } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initializing && user) {
      router.replace('/(tabs)');
    }
  }, [initializing, user]);

  const handleRegister = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Display name is required.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Validation', 'Please enter a valid email.');
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        'Validation',
        'Password must be at least 6 characters.'
      );
      return;
    }

    setSubmitting(true    );
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (e: any) {
      Alert.alert('Registration error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        Create Account
      </Text>

      <TextInput
        placeholder="Display Name"
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        value={displayName}
        onChangeText={setDisplayName}
      />

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
        title={submitting ? 'Registering...' : 'Register'}
        onPress={handleRegister}
        disabled={submitting}
        color={theme.colors.primary}
      />

      <View style={{ height: 16 }} />
      <Link
        href="/"
        style={{ color: theme.colors.primary, textAlign: 'center' }}
      >
        Already have an account? Login
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
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
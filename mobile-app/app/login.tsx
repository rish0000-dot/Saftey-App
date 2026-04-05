import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Theme } from '../constants/theme';

export default function PremiumLoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useFocusEffect(
    useCallback(() => {
      setEmail('');
      setPassword('');
      setFocusedField(null);
    }, [])
  );

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Required tactical credentials missing.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Format', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Activation Required',
            'Your Guardian account is created but not yet active. Please check your email inbox (and spam) to confirm your registration.',
            [{ text: 'GOT IT' }]
          );
          return;
        }
        throw error;
      }

      if (data.session) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Access Denied', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, setValue: (v: string) => void, icon: string, placeholder: string, key: string, options: any = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={[styles.inputWrapper, focusedField === key && styles.inputWrapperFocused]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={focusedField === key ? Theme.colors.primary : Theme.colors.outline} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={value}
          onChangeText={setValue}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
          spellCheck={false}
          importantForAutofill="no"
          {...options}
        />
        {key === 'password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Theme.colors.outline} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={[Theme.colors.surfaceDim, Theme.colors.surface]} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="shield-key" size={80} color={Theme.colors.primary} style={styles.logo} />
          <Text style={styles.title}>Secure Access</Text>
          <Text style={styles.subtitle}>Authentication required for Guardian services</Text>
        </View>

        <View style={styles.form}>
          {/* Dummy fields to intercept strong browser autofill */}
          {Platform.OS === 'web' && (
            <View style={{ height: 0, width: 0, overflow: 'hidden', opacity: 0, position: 'absolute' }}>
              <TextInput value="" />
              <TextInput secureTextEntry value="" />
            </View>
          )}
          {renderInput('Guardian ID', email, setEmail, 'email-outline', 'guardian@safelife.ai', 'email', { keyboardType: 'email-address', autoCapitalize: 'none' })}
          {renderInput('Access Cipher', password, setPassword, 'lock-outline', '••••••••', 'password', { secureTextEntry: !showPassword, autoComplete: 'new-password', textContentType: 'newPassword' })}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={[Theme.colors.primary, Theme.colors.primaryContainer]} style={styles.buttonGrad}>
              {loading ? <ActivityIndicator color="#003840" /> : <Text style={styles.buttonText}>AUTHORIZE SESSION</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')} style={styles.footerLink}>
            <Text style={styles.footerText}>
              NEW GUARDIAN? <Text style={styles.linkText}>RECRUIT NOW</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.surface },
  content: { flex: 1, padding: 32, justifyContent: 'center' },
  header: { marginBottom: 48, alignItems: 'center' },
  logo: { marginBottom: 16, shadowColor: Theme.colors.primary, shadowOpacity: 0.5, shadowRadius: 25 },
  title: { fontFamily: Theme.fonts.headline, fontSize: 32, color: Theme.colors.onSurface, letterSpacing: -1 },
  subtitle: { fontFamily: Theme.fonts.body, fontSize: 14, color: Theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 },
  form: { gap: 24 },
  inputContainer: { gap: 8 },
  label: { fontFamily: Theme.fonts.label, fontSize: 10, fontWeight: '700', color: Theme.colors.primary, letterSpacing: 2 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    gap: 12,
  },
  inputWrapperFocused: { borderColor: Theme.colors.primary },
  input: { flex: 1, fontFamily: Theme.fonts.body, fontSize: 16, color: Theme.colors.onSurface },
  eyeBtn: { padding: 4 },
  button: { marginTop: 12, borderRadius: 12, overflow: 'hidden', height: 56, elevation: 10, shadowColor: Theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 15 },
  buttonGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Theme.fonts.headline, color: '#003840', fontSize: 16, letterSpacing: 2, fontWeight: '900' },
  footerLink: { marginTop: 20, alignItems: 'center' },
  footerText: { fontFamily: Theme.fonts.label, color: Theme.colors.onSurfaceVariant, fontSize: 11, letterSpacing: 1 },
  linkText: { color: Theme.colors.primary, fontWeight: '900' },
});

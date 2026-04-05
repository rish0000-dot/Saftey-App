import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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

export default function PremiumRegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  useFocusEffect(
    useCallback(() => {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
      });
      setFocusedField(null);
    }, [])
  );

  const handleRegister = async () => {
    const { email, password, firstName, lastName, phone, address } = formData;

    if (!email || !password || !firstName || !phone) {
      Alert.alert('Incomplete Intel', 'Required tactical fields must be filled.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]{10,15}$/;

    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Format', 'Please enter a valid email address.');
      return;
    }
    if (!nameRegex.test(firstName) || (lastName && !nameRegex.test(lastName))) {
      Alert.alert('Invalid Format', 'Names can only contain alphabetical characters and spaces.');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || !phoneRegex.test(phone)) {
      Alert.alert('Invalid Format', 'Please enter a valid phone number (min 10 digits).');
      return;
    }

    setLoading(true);

    const showAlreadyRegisteredAlert = () => {
      Alert.alert(
        'Already Registered',
        'You are already registered. Redirecting to login page...',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    };

    try {
      // 1. Attempt pre-check just in case RLS allows it
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .or(`phone.eq.${phone},email.eq.${email}`)
        .maybeSingle();

      if (existingUser) {
        showAlreadyRegisteredAlert();
        return;
      }

      // 2. Attempt Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        const errorMsg = authError.message.toLowerCase();
        if (errorMsg.includes('already registered') || errorMsg.includes('already been taken') || errorMsg.includes('exists')) {
          showAlreadyRegisteredAlert();
          return;
        }
        throw authError;
      }

      // 3. Supabase anti-enumeration protection check
      if (authData?.user?.identities && authData.user.identities.length === 0) {
        showAlreadyRegisteredAlert();
        return;
      }

      // 4. Create the profile
      if (authData?.user) {
        const uniqueId = `SL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              email,
              phone,
              address,
              unique_id: uniqueId,
            },
          ]);

        if (profileError) {
          if (profileError.code === '23505') {
            showAlreadyRegisteredAlert();
            return;
          }
          throw profileError;
        }
        Alert.alert('System Initialized', `Welcome Guardian. Your Unique ID is ${uniqueId}`);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('already') || msg.includes('duplicate') || msg.includes('unique')) {
        showAlreadyRegisteredAlert();
      } else {
        Alert.alert('Protocol Failure', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string, 
    key: keyof typeof formData, 
    icon: string, 
    placeholder: string, 
    options: any = {}
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={[
        styles.inputWrapper, 
        focusedField === key && styles.inputWrapperFocused
      ]}>
        <MaterialCommunityIcons 
          name={icon as any} 
          size={18} 
          color={focusedField === key ? Theme.colors.primary : Theme.colors.outline} 
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={formData[key]}
          onChangeText={(val) => setFormData({ ...formData, [key]: val })}
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
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="shield-account" size={60} color={Theme.colors.primary} style={styles.logo} />
          <Text style={styles.title}>System Initialization</Text>
          <Text style={styles.subtitle}>Enlist in the SafeLife AI Guardian Network</Text>
        </View>

        <View style={styles.form}>
          {/* Dummy fields to intercept strong browser autofill */}
          {Platform.OS === 'web' && (
            <View style={{ height: 0, width: 0, overflow: 'hidden', opacity: 0, position: 'absolute' }}>
              <TextInput value="" />
              <TextInput secureTextEntry value="" />
            </View>
          )}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              {renderInput('First Name', 'firstName', 'account-outline', 'John')}
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              {renderInput('Last Name', 'lastName', 'account-outline', 'Doe')}
            </View>
          </View>

          {renderInput('Tactical Email', 'email', 'email-outline', 'guardian@safelife.ai', { keyboardType: 'email-address', autoCapitalize: 'none' })}
          {renderInput('Access Cipher', 'password', 'lock-outline', '••••••••', { secureTextEntry: !showPassword, autoComplete: 'new-password', textContentType: 'newPassword' })}
          {renderInput('Comms Channel', 'phone', 'phone-outline', '+91 XXXXX XXXXX', { keyboardType: 'phone-pad' })}
          {renderInput('Deployment Base', 'address', 'map-marker-outline', 'Home Base Coordinates', { multiline: true })}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            <LinearGradient colors={[Theme.colors.primary, Theme.colors.primaryContainer]} style={styles.buttonGrad}>
              {loading ? <ActivityIndicator color="#003840" /> : <Text style={styles.buttonText}>INITIALOIZE PROFILE</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')} style={styles.footerLink}>
            <Text style={styles.footerText}>
              ALREADY REGISTERED? <Text style={styles.linkText}>SIGN IN</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.surface },
  scrollContent: { padding: 32, paddingTop: 60 },
  header: { marginBottom: 40, alignItems: 'center' },
  logo: { marginBottom: 16, shadowColor: Theme.colors.primary, shadowOpacity: 0.5, shadowRadius: 20 },
  title: { fontFamily: Theme.fonts.headline, fontSize: 32, color: Theme.colors.onSurface, letterSpacing: -1, textAlign: 'center' },
  subtitle: { fontFamily: Theme.fonts.body, fontSize: 14, color: Theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 },
  form: { gap: 20 },
  row: { flexDirection: 'row' },
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
  inputWrapperFocused: {
    borderColor: Theme.colors.primary,
  },
  input: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  eyeBtn: { padding: 4 },
  button: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
    elevation: 10,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  buttonGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Theme.fonts.headline, color: '#003840', fontSize: 16, letterSpacing: 2, fontWeight: '900' },
  footerLink: { marginTop: 24, alignItems: 'center' },
  footerText: { fontFamily: Theme.fonts.label, color: Theme.colors.onSurfaceVariant, fontSize: 11, letterSpacing: 1 },
  linkText: { color: Theme.colors.primary, fontWeight: '900' },
});

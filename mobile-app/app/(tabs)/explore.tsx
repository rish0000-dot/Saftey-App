import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';

export default function PremiumProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🔐 Tactical De-authorization Initiated...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Mission Complete: Session Closed');
      // RootLayout listener handles redirection
    } catch (err: any) {
      console.error('❌ Error shutting down session:', err.message);
      Alert.alert('System Error', 'Failed to close session: ' + err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Theme.colors.surfaceDim, Theme.colors.surface]} style={StyleSheet.absoluteFillObject} />
      
      {/* Fixed Logout Button for maximum touch reliability */}
      <TouchableOpacity 
        onPress={handleSignOut} 
        style={styles.fixedLogoutBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
      >
        <LinearGradient
          colors={['rgba(245, 51, 53, 0.2)', 'rgba(245, 51, 53, 0.05)']}
          style={styles.logoutBtnGrad}
        >
          <MaterialCommunityIcons name="logout-variant" size={24} color={Theme.colors.tertiary} />
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Guardian Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileHero}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="shield-account" size={40} color={Theme.colors.primary} />
            </View>
          </View>
          <Text style={styles.userName}>{profile?.first_name} {profile?.last_name}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idLabel}>TACTICAL ID:</Text>
            <Text style={styles.idValue}>{profile?.unique_id}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <BlurView intensity={20} tint="dark" style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="mail-outline" size={16} color={Theme.colors.primary} />
              <Text style={styles.cardLabel}>Verified Email</Text>
            </View>
            <Text style={styles.cardValue}>{profile?.email}</Text>
          </BlurView>

          <BlurView intensity={20} tint="dark" style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="call-outline" size={16} color={Theme.colors.primary} />
              <Text style={styles.cardLabel}>Emergency Comms</Text>
            </View>
            <Text style={styles.cardValue}>{profile?.phone}</Text>
          </BlurView>
        </View>

        <BlurView intensity={20} tint="dark" style={[styles.infoCard, { marginTop: 16 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="map-outline" size={16} color={Theme.colors.primary} />
            <Text style={styles.cardLabel}>Deployment Base (Address)</Text>
          </View>
          <Text style={[styles.cardValue, { fontSize: 13, lineHeight: 20 }]}>{profile?.address}</Text>
        </BlurView>

        {/* Security Summary */}
        <Text style={styles.sectionTitle}>Security Protocol</Text>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconBox}>
            <Ionicons name="finger-print-outline" size={20} color={Theme.colors.onSurface} />
          </View>
          <Text style={styles.menuLabel}>Biometric Lockdown</Text>
          <Ionicons name="chevron-forward" size={18} color={Theme.colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconBox}>
            <Ionicons name="shield-half-outline" size={20} color={Theme.colors.onSurface} />
          </View>
          <Text style={styles.menuLabel}>Vault Protection</Text>
          <Text style={styles.badgeText}>ACTIVE</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.surface },
  loaderContainer: { flex: 1, backgroundColor: Theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontFamily: Theme.fonts.headline, fontSize: 24, color: Theme.colors.onSurface, letterSpacing: -1 },
  fixedLogoutBtn: { 
    position: 'absolute', 
    right: 24, 
    top: 60, 
    zIndex: 999, 
    elevation: 10 
  },
  logoutBtnGrad: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(245, 51, 53, 0.2)' 
  },
  profileHero: { alignItems: 'center', marginBottom: 40 },
  avatarGlow: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.colors.primary + '11', alignItems: 'center', justifyContent: 'center', shadowColor: Theme.colors.primary, shadowRadius: 30, shadowOpacity: 0.2 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Theme.colors.primary + '33' },
  userName: { fontFamily: Theme.fonts.headline, fontSize: 24, color: Theme.colors.onSurface, marginTop: 16 },
  idBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surfaceContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  idLabel: { fontFamily: Theme.fonts.label, fontSize: 9, color: Theme.colors.onSurfaceVariant, marginRight: 6, opacity: 0.6 },
  idValue: { fontFamily: Theme.fonts.headline, fontSize: 11, color: Theme.colors.primary, letterSpacing: 1 },
  infoGrid: { flexDirection: 'row', gap: 16 },
  infoCard: { flex: 1, padding: 16, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardLabel: { fontFamily: Theme.fonts.label, fontSize: 9, color: Theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
  cardValue: { fontFamily: Theme.fonts.bodyBold, fontSize: 14, color: Theme.colors.onSurface },
  sectionTitle: { fontFamily: Theme.fonts.headline, fontSize: 18, color: Theme.colors.onSurface, marginTop: 32, marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  menuIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuLabel: { flex: 1, fontFamily: Theme.fonts.bodyBold, fontSize: 14, color: Theme.colors.onSurface },
  badgeText: { fontFamily: Theme.fonts.label, fontSize: 10, color: '#00FF88', fontWeight: '900', letterSpacing: 1 },
});

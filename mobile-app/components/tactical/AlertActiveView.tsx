import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Linking,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { rankSafePlaces, calculateBearing, getCardinalDirection, SafePlace } from '../../utils/escapeLogic';

interface Props {
  onStop: () => void;
  lat: string;
  lng: string;
  cachedSafePlaces?: any[];
}

export default function AlertActiveView({ onStop, lat, lng, cachedSafePlaces = [] }: Props) {
  const [timer, setTimer] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [bestPlace, setBestPlace] = useState<SafePlace | null>(null);
  const [bearingHint, setBearingHint] = useState<string>("Calculating...");

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lat && lng && lat !== "Loading..." && cachedSafePlaces.length > 0) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const ranked = rankSafePlaces(cachedSafePlaces, latNum, lngNum);
      if (ranked.length > 0) {
        setBestPlace(ranked[0]);
        const bearing = calculateBearing(latNum, lngNum, ranked[0].lat, ranked[0].lng);
        setBearingHint(`HEAD ${getCardinalDirection(bearing).toUpperCase()}`);
      }
    }
  }, [lat, lng, cachedSafePlaces]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getDistanceColor = (distance?: number) => {
    if (!distance) return Theme.colors.onSurfaceVariant;
    if (distance <= 200) return '#00FF88'; // High Priority / Super Close
    if (distance <= 500) return '#FFC107'; // Med
    return '#FF3B3B'; // Far
  };

  const handleNavigate = () => {
    if (bestPlace) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${bestPlace.lat},${bestPlace.lng}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#1A0505', '#0C0C1D']} style={StyleSheet.absoluteFillObject} />
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={true} 
        indicatorStyle="white"
      >
        {/* Alert Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="shield-alert" size={24} color={Theme.colors.tertiary} />
            <Text style={styles.brandTitle}>SafeLife AI</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE GPS</Text>
          </View>
        </View>

        <View style={styles.alertBadgeWrapper}>
          <View style={styles.alertBadge}>
            <Ionicons name="warning" size={16} color={Theme.colors.tertiary} />
            <Text style={styles.alertBadgeText}>ALERT ACTIVE — {formatTime(timer)}</Text>
          </View>
        </View>

        {/* ESCAPE HUD */}
        <View style={styles.escapeHudContainer}>
          {bestPlace ? (
            <Animated.View style={[styles.escapeCard, { transform: [{ scale: pulseAnim }], borderColor: getDistanceColor(bestPlace.distance) + '55' }]}>
              <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.escapeGradient}>
                
                <Text style={styles.ctaHeading}>🚨 RUN TO THIS LOCATION</Text>
                
                <View style={styles.targetRow}>
                  <Text style={styles.distanceMetric} numberOfLines={1} adjustsFontSizeToFit>
                    {Math.round(bestPlace.distance || 0)}m
                  </Text>
                  <View style={styles.targetCol}>
                    <Text style={[styles.directionHint, { color: getDistanceColor(bestPlace.distance) }]}>
                      {bearingHint}
                    </Text>
                    <Text style={styles.targetName} numberOfLines={2}>
                      {bestPlace.name}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.navButton} onPress={handleNavigate}>
                  <LinearGradient colors={['#00FF88', '#00CC6A']} style={styles.navGrad} start={{ x:0, y:0 }} end={{ x:1, y:1 }}>
                    <FontAwesome5 name="directions" size={20} color="#000" />
                    <Text style={styles.navText}>START NAVIGATION</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
              </LinearGradient>
            </Animated.View>
          ) : (
            <View style={styles.fallbackHUD}>
               <Ionicons name="compass" size={40} color={Theme.colors.tertiary} />
               <Text style={styles.fallbackTitle}>SEEK CROWDED AREA</Text>
               <Text style={styles.fallbackSub}>Move towards a main road or a populated location immediately.</Text>
            </View>
          )}
        </View>

        {/* Alternative Safe Hubs */}
        {cachedSafePlaces.length > 1 && (
          <View style={styles.alternativeHubsSection}>
            <Text style={styles.alternativeHubsTitle}>ALTERNATIVE ROUTES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} indicatorStyle="white" contentContainerStyle={{ gap: 16, paddingBottom: 10 }}>
              {rankSafePlaces(cachedSafePlaces, parseFloat(lat), parseFloat(lng)).slice(1, 10).map((place, index) => (
                <View key={`${place.id}-${index}`} style={styles.safeHubCard}>
                  <View style={styles.hubHeader}>
                      <MaterialCommunityIcons 
                        name={place.category === 'police' ? 'police-badge' : place.category === 'hospital' ? 'hospital-box' : place.category === 'university' ? 'school' : place.category === 'hostel' ? 'bed' : 'map-marker-radius'} 
                        size={24} 
                        color={place.category === 'police' ? '#4A90E2' : place.category === 'hospital' ? '#FF3B3B' : place.category === 'university' ? '#9B51E0' : place.category === 'hostel' ? '#F2994A' : Theme.colors.primary} 
                      />
                      <Text style={styles.hubDistance}>{Math.round(place.distance || 0)}m</Text>
                  </View>
                  <Text style={styles.hubName} numberOfLines={2}>{place.name}</Text>
                  <TouchableOpacity style={styles.hubNavBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`)}>
                      <Text style={styles.hubNavText}>GO HERE INSTEAD</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.spacer} />

        {/* Stop Button */}
        <View style={styles.stopButtonContainer}>
          <TouchableOpacity style={styles.stopButton} onPress={onStop}>
            <View style={styles.stopGrad}>
              <Ionicons name="close-circle" size={40} color={Theme.colors.tertiary} />
              <Text style={styles.stopText}>STOP ALERT</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { fontFamily: Theme.fonts.headline, fontSize: 24, color: Theme.colors.tertiary, letterSpacing: -1 },
  livePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 51, 53, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245, 51, 53, 0.2)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.tertiary, marginRight: 8 },
  liveLabel: { fontFamily: Theme.fonts.label, fontSize: 10, color: Theme.colors.tertiary, fontWeight: 'bold' },
  alertBadgeWrapper: { alignItems: 'center', marginVertical: 20 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 51, 53, 0.15)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, gap: 12, borderWidth: 1, borderColor: 'rgba(245, 51, 53, 0.3)' },
  alertBadgeText: { fontFamily: Theme.fonts.label, fontSize: 14, color: Theme.colors.tertiary, fontWeight: 'bold', letterSpacing: 2 },
  
  escapeHudContainer: { justifyContent: 'center', alignItems: 'center' },
  escapeCard: { width: '100%', borderRadius: 30, borderWidth: 2, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.5)', shadowColor: '#00FF88', shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
  escapeGradient: { padding: 30, alignItems: 'center' },
  ctaHeading: { fontFamily: Theme.fonts.headline, fontSize: 20, color: Theme.colors.onSurface, letterSpacing: 1, marginBottom: 20, textAlign: 'center' },
  targetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30, width: '100%' },
  targetCol: { flex: 1, marginLeft: 16 },
  distanceMetric: { fontFamily: Theme.fonts.headline, fontSize: 60, color: '#FFF', fontWeight: '900', letterSpacing: -3 },
  directionHint: { fontFamily: Theme.fonts.headline, fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  targetName: { fontFamily: Theme.fonts.body, fontSize: 16, color: Theme.colors.onSurfaceVariant, fontWeight: '600' },
  navButton: { width: '100%', height: 60, borderRadius: 30, overflow: 'hidden' },
  navGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  navText: { fontFamily: Theme.fonts.headline, fontSize: 16, color: '#000', letterSpacing: 1, fontWeight: '900' },
  
  fallbackHUD: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,51,53,0.1)', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(245,51,53,0.3)', width: '100%' },
  fallbackTitle: { fontFamily: Theme.fonts.headline, fontSize: 20, color: Theme.colors.tertiary, marginTop: 16, textAlign: 'center' },
  fallbackSub: { fontFamily: Theme.fonts.body, fontSize: 14, color: Theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  spacer: { height: 40 },
  stopButtonContainer: { paddingBottom: 20, alignItems: 'center' },
  stopButton: { width: 240, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(245, 51, 53, 0.3)', backgroundColor: 'transparent', overflow: 'hidden' },
  stopGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  stopText: { fontFamily: Theme.fonts.headline, fontSize: 18, color: Theme.colors.tertiary, letterSpacing: 1, fontWeight: 'bold' },

  alternativeHubsSection: { marginTop: 32 },
  alternativeHubsTitle: { fontFamily: Theme.fonts.headline, fontSize: 14, color: Theme.colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 16 },
  safeHubCard: { width: 140, backgroundColor: 'rgba(36, 35, 59, 0.4)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  hubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  hubDistance: { fontFamily: Theme.fonts.headline, fontSize: 14, color: '#FFF' },
  hubName: { flex: 1, fontFamily: Theme.fonts.body, fontSize: 12, color: Theme.colors.onSurfaceVariant, marginBottom: 16 },
  hubNavBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 8, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  hubNavText: { fontFamily: Theme.fonts.label, fontSize: 9, color: Theme.colors.primary, fontWeight: 'bold' },
});

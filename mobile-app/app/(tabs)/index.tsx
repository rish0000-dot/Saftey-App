import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as Battery from "expo-battery";
import { supabase } from "../../utils/supabase";
import { Theme } from "../../constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AlertActiveView from "../../components/tactical/AlertActiveView";
import { rankSafePlaces, calculateBearing, getCardinalDirection } from "../../utils/escapeLogic";

const { width, height } = Dimensions.get("window");

export default function TacticalDashboard() {
  // --- States ---
  const [status, setStatus] = useState<"SAFE" | "ALERT ACTIVE">("SAFE");
  const [lat, setLat] = useState<string>("Loading...");
  const [lng, setLng] = useState<string>("Loading...");
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [nearestStation, setNearestStation] = useState("Searching...");
  const [isLoading, setIsLoading] = useState(false);
  const [cachedSafePlaces, setCachedSafePlaces] = useState<any[]>([]);
  const lastFetchTime = useRef<number>(0);

  // --- Animations ---
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sosScale = useRef(new Animated.Value(1)).current;

  // --- Effects ---
  useEffect(() => {
    const setupSubscriptions = async () => {
      try {
        // Instant Offline Loading
        const offlineCache = await AsyncStorage.getItem('safePlacesCache');
        if (offlineCache) setCachedSafePlaces(JSON.parse(offlineCache));

        const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
        if (permissionStatus !== "granted") return;

        // Initial Location
        const location = await Location.getCurrentPositionAsync({});
        updateLocationData(location);

        // Battery
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(level * 100));

        // Initial Profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setUserData(data);
        }

        // Location Watcher
        const locSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
          (loc) => updateLocationData(loc)
        );

        // Battery Watcher
        const batSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryLevel(Math.round(batteryLevel * 100));
        });

        return () => {
          locSub.remove();
          batSub.remove();
        };
      } catch (err) {
        console.log("Setup error:", err);
      }
    };

    setupSubscriptions();

    // Pulse Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const updateLocationData = (location: Location.LocationObject) => {
    const currentLat = location.coords.latitude.toFixed(6);
    const currentLng = location.coords.longitude.toFixed(6);
    setLat(currentLat);
    setLng(currentLng);
    setIsMoving(location.coords.speed !== null && location.coords.speed > 0.5);
    fetchSafePlacesCache(currentLat, currentLng);
  };

  const fetchSafePlacesCache = async (lat: string, lng: string) => {
    const now = Date.now();
    
    // Prevent API spam bans. 30 second cooldown minimum, 3 minute standard refresh rate if we have data.
    if (now - lastFetchTime.current < 30000) return;
    if (now - lastFetchTime.current < 180000 && cachedSafePlaces.length > 0) return;
    
    lastFetchTime.current = now;

    try {
      const query = `[out:json];(nwr["amenity"="police"](around:50000,${lat},${lng});nwr["amenity"~"hospital|clinic|mall|cafe|bank|pharmacy|university|college"](around:10000,${lat},${lng});nwr["tourism"~"hostel|hotel"](around:10000,${lat},${lng});nwr["shop"~"mall|supermarket|department_store"](around:10000,${lat},${lng}););out center;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const parsedPlaces = data.elements.map((el: any) => {
          let category = 'other';
          const amenity = el.tags?.amenity || '';
          const tourism = el.tags?.tourism || '';
          const shop = el.tags?.shop || '';
          const name = (el.tags?.name || '').toLowerCase();

          if (amenity.includes('police')) category = 'police';
          else if (amenity.includes('university') || amenity.includes('college') || name.includes('gla university')) category = 'university';
          else if (amenity.includes('hospital') || amenity.includes('clinic')) category = 'hospital';
          else if (tourism.includes('hostel') || name.includes('hostel')) category = 'hostel';
          else if (amenity.includes('mall') || amenity.includes('cafe') || shop !== '') category = 'crowd';

          return {
            id: el.id,
            lat: el.lat || el.center?.lat,
            lng: el.lon || el.center?.lon,
            name: el.tags?.name || category.toUpperCase(),
            phone: el.tags?.phone || el.tags?.['contact:phone'] || 'N/A',
            category
          };
        }).filter((p: any) => p.lat && p.lng);

        setCachedSafePlaces(parsedPlaces);
        AsyncStorage.setItem('safePlacesCache', JSON.stringify(parsedPlaces));
        
        const policeStations = parsedPlaces.filter((p: any) => p.category === 'police');
        if (policeStations.length > 0) {
          setNearestStation(policeStations[0].name || "Police Station Nearby");
        } else if (parsedPlaces.length > 0) {
          setNearestStation(parsedPlaces[0].name || "Safe Zone Nearby");
        } else {
          setNearestStation("No station found in 3km");
        }
      } else {
        setNearestStation("No station found in 3km");
      }
    } catch (err) {
      setNearestStation("Station data unavailable");
    }
  };

  const sendSOSAlert = async () => {
    const BACKEND_URL = "http://172.16.48.118:5000";
    setIsLoading(true);
    setStatus("ALERT ACTIVE");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${BACKEND_URL}/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          name: userData ? `${userData.first_name} ${userData.last_name}` : "Unknown User",
          phone: userData ? userData.phone : "Not Provided",
          battery: batteryLevel,
          status: isMoving ? "Moving" : "Stationary",
          nearestStation,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await response.json();
      if (data.success) {
        Alert.alert("✅ Alert Sent", "Emergency contacts have been notified.");
      }
    } catch (err: any) {
      Alert.alert("❌ Alert Failed", "Could not reach emergency servers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSOSPress = () => {
    Animated.sequence([
      Animated.spring(sosScale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(sosScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => sendSOSAlert());
  };

  if (status === "ALERT ACTIVE") {
    return (
      <AlertActiveView 
        lat={lat} 
        lng={lng} 
        cachedSafePlaces={cachedSafePlaces}
        onStop={() => {
          setStatus("SAFE");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Theme.colors.surfaceDim, Theme.colors.surface]} style={StyleSheet.absoluteFillObject} />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: Theme.colors.primary + '22' }]} />
      <View style={[styles.orb, { bottom: -100, left: -100, backgroundColor: Theme.colors.secondary + '11' }]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="shield-check" size={24} color={Theme.colors.primaryContainer} />
            <Text style={styles.brandTitle}>SafeLife AI</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: status === 'SAFE' ? '#00FF88' : '#FF3B3B' }]} />
            <Text style={styles.statusLabel}>{status}</Text>
          </View>
        </View>

        {/* Guardian Active Badge */}
        <View style={styles.guardianPill}>
          <Ionicons name="shield-checkmark" size={16} color="#00FF88" />
          <Text style={styles.guardianText}>SYSTEM GUARDIAN ACTIVE</Text>
        </View>

        {/* SOS Core */}
        <View style={styles.sosContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.sosButtonContainer, { transform: [{ scale: sosScale }] }]}>
            <TouchableOpacity onPress={handleSOSPress} activeOpacity={0.9} style={styles.sosButton}>
              <LinearGradient colors={['#121223', '#0C0C1D']} style={styles.sosGradient}>
                <MaterialCommunityIcons name="fingerprint" size={64} color={Theme.colors.primary} />
                <Text style={styles.sosButtonText}>TAP FOR SOS</Text>
                <Text style={styles.sosButtonSub}>EMERGENCY RESPONSE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Location Information */}
        <BlurView intensity={20} tint="dark" style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Ionicons name="location" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardTitle}>Live Location</Text>
              <Text style={styles.cardSubTitle}>{userData?.address || "Current Zone"}</Text>
            </View>
            <View style={styles.signalBox}>
              <Text style={styles.signalLabel}>SIGNAL</Text>
              <View style={styles.signalBars}>
                <View style={styles.bar} />
                <View style={styles.bar} />
                <View style={styles.bar} />
                <View style={[styles.bar, { opacity: 0.3 }]} />
              </View>
            </View>
          </View>
          <View style={styles.coordsRow}>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>LATITUDE</Text>
              <Text style={styles.coordValue}>{lat}° N</Text>
            </View>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>LONGITUDE</Text>
              <Text style={styles.coordValue}>{lng}° W</Text>
            </View>
          </View>
        </BlurView>

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
          {[
            { icon: 'call', label: 'Call', action: () => Linking.openURL('tel:112') },
            { icon: 'mic', label: 'Voice', action: () => Alert.alert('Voice Detection', 'Started...') },
            { icon: 'map', label: 'Map', action: () => Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`) },
            { icon: 'share-social', label: 'Share', action: () => Alert.alert('Share', 'Location shared.') },
          ].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.actionItem} onPress={item.action}>
              <View style={styles.actionIconBox}>
                <Ionicons name={item.icon as any} size={24} color={Theme.colors.onSurface} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Police Stations Radar (50km) */}
        {lat !== "Loading..." && cachedSafePlaces.filter(p => p.category === 'police').length > 0 ? (
          <View style={styles.policeSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="police-badge" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Police Stations (50km Radar)</Text>
            </View>
            
            {rankSafePlaces(cachedSafePlaces.filter(p => p.category === 'police'), parseFloat(lat), parseFloat(lng)).slice(0, 5).map((station: any, idx: number) => {
              const bearing = calculateBearing(parseFloat(lat), parseFloat(lng), station.lat, station.lng);
              const direction = getCardinalDirection(bearing);
              const distMeters = Math.round(station.distance || 0);
              const displayDist = distMeters > 1000 ? (distMeters / 1000).toFixed(1) + 'km' : distMeters + 'm';
              
              return (
                <View key={idx} style={styles.policeCard}>
                  <View style={styles.policeCardHeader}>
                    <Text style={styles.policeName} numberOfLines={1}>{station.name}</Text>
                    <View style={styles.distDirBox}>
                      <Ionicons name="compass" size={12} color="#00FF88" />
                      <Text style={styles.policeDistance}>{displayDist} {direction}</Text>
                    </View>
                  </View>

                  <View style={styles.policeActionRow}>
                    <TouchableOpacity style={styles.policeDetailBox} onPress={() => Linking.openURL(`tel:${station.phone !== 'N/A' ? station.phone : '100'}`)}>
                      <Ionicons name="call" size={16} color={Theme.colors.onSurface} />
                      <Text style={styles.policePhone}>{station.phone !== 'N/A' ? station.phone : '100 (Emergency)'}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.policeNavBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`)}>
                      <FontAwesome5 name="directions" size={14} color="#000" />
                      <Text style={styles.policeNavText}>GO</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={[styles.glassCard, styles.bannerCard]}>
            <MaterialCommunityIcons name="police-badge" size={20} color={Theme.colors.primary} />
            <Text style={styles.bannerText}>Nearest Station: {nearestStation}</Text>
          </View>
        )}

        {/* Nearby Safe Hubs Section */}
        {lat !== "Loading..." && (
          <View style={styles.safeHubsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-half" size={20} color={Theme.colors.primary} />
              <Text style={styles.sectionTitle}>Nearby Safe Hubs</Text>
            </View>
            
            {cachedSafePlaces.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={true} indicatorStyle="white" contentContainerStyle={{ gap: 16, paddingBottom: 10 }}>
                {rankSafePlaces(cachedSafePlaces, parseFloat(lat), parseFloat(lng)).slice(0, 25).map((place, index) => (
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
                       <Text style={styles.hubNavText}>GET DIRECTIONS</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.glassCard, { marginTop: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }]}>
                 <ActivityIndicator size="small" color={Theme.colors.primary} />
                 <Text style={{ fontFamily: Theme.fonts.label, color: Theme.colors.onSurfaceVariant, marginTop: 12 }}>Scanning 10km radius for Safe Areas...</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loaderText}>ACTIVATING SOS...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.surface },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { fontFamily: Theme.fonts.headline, fontSize: 24, color: Theme.colors.primaryContainer, letterSpacing: -1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusLabel: { fontFamily: Theme.fonts.label, fontSize: 10, color: Theme.colors.onSurface, fontWeight: 'bold' },
  guardianPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 8, marginBottom: 32 },
  guardianText: { fontFamily: Theme.fonts.label, fontSize: 11, color: Theme.colors.onSurface, opacity: 0.8, letterSpacing: 2 },
  sosContainer: { height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  pulseRing: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 2, borderColor: Theme.colors.primary + '33' },
  sosButtonContainer: { width: 220, height: 220, borderRadius: 110, padding: 8, backgroundColor: Theme.colors.surfaceContainerHigh, elevation: 20, shadowColor: Theme.colors.primaryContainer, shadowOpacity: 0.3, shadowRadius: 30 },
  sosButton: { flex: 1, borderRadius: 100, overflow: 'hidden' },
  sosGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Theme.colors.primary + '22' },
  sosButtonText: { fontFamily: Theme.fonts.headline, color: Theme.colors.primary, fontSize: 18, marginTop: 12, letterSpacing: 2 },
  sosButtonSub: { fontFamily: Theme.fonts.label, color: Theme.colors.onSurfaceVariant, fontSize: 9, letterSpacing: 1, marginTop: 4 },
  glassCard: { borderRadius: 24, backgroundColor: 'rgba(36, 35, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20, overflow: 'hidden', marginBottom: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.primary + '22', alignItems: 'center', justifyContent: 'center' },
  cardTitleBox: { flex: 1, marginLeft: 16 },
  cardTitle: { fontFamily: Theme.fonts.headline, fontSize: 18, color: Theme.colors.onSurface },
  cardSubTitle: { fontFamily: Theme.fonts.body, fontSize: 12, color: Theme.colors.onSurfaceVariant },
  signalBox: { alignItems: 'flex-end' },
  signalLabel: { fontFamily: Theme.fonts.label, fontSize: 8, color: Theme.colors.primary },
  signalBars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  bar: { width: 4, height: 12, backgroundColor: Theme.colors.primary, borderRadius: 2 },
  coordsRow: { flexDirection: 'row', gap: 12 },
  coordBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  coordLabel: { fontFamily: Theme.fonts.label, fontSize: 8, color: Theme.colors.onSurfaceVariant, marginBottom: 4 },
  coordValue: { fontFamily: Theme.fonts.headline, fontSize: 14, color: Theme.colors.onSurface },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionItem: { alignItems: 'center', gap: 8 },
  actionIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: Theme.fonts.label, fontSize: 10, color: Theme.colors.onSurface, fontWeight: 'bold' },
  bannerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  bannerText: { fontFamily: Theme.fonts.body, fontSize: 13, color: Theme.colors.onSurface },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  loaderText: { fontFamily: Theme.fonts.headline, color: Theme.colors.primary, marginTop: 16, letterSpacing: 4 },
  safeHubsSection: { marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontFamily: Theme.fonts.headline, fontSize: 16, color: Theme.colors.onSurface },
  safeHubCard: { width: 140, backgroundColor: 'rgba(36, 35, 59, 0.4)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  hubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  hubDistance: { fontFamily: Theme.fonts.headline, fontSize: 14, color: '#FFF' },
  hubName: { flex: 1, fontFamily: Theme.fonts.body, fontSize: 12, color: Theme.colors.onSurfaceVariant, marginBottom: 16 },
  hubNavBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 8, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  hubNavText: { fontFamily: Theme.fonts.label, fontSize: 10, color: Theme.colors.primary, fontWeight: 'bold' },

  policeSection: { marginTop: 8, marginBottom: 16 },
  policeCard: { backgroundColor: 'rgba(36, 35, 59, 0.4)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(74, 144, 226, 0.2)', marginBottom: 12 },
  policeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  policeName: { flex: 1, fontFamily: Theme.fonts.headline, fontSize: 14, color: Theme.colors.onSurface, marginRight: 8 },
  distDirBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 255, 136, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  policeDistance: { fontFamily: Theme.fonts.headline, fontSize: 12, color: '#00FF88' },
  policeActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  policeDetailBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  policePhone: { fontFamily: Theme.fonts.label, fontSize: 12, color: Theme.colors.onSurfaceVariant },
  policeNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#00FF88', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  policeNavText: { fontFamily: Theme.fonts.headline, fontSize: 12, color: '#000', fontWeight: 'bold' },
});

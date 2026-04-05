import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.onSurfaceVariant,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(12, 12, 29, 0.7)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          />
        ),
        tabBarLabelStyle: {
          fontFamily: Theme.fonts.label,
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 12,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'GUARDIAN',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "shield-check" : "shield-check-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

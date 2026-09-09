import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import '../global.css';
import { initializeDatabase } from '../src/database/database';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';

function RootContent() {
  const { colors } = useTheme();

  const [isReady, setIsReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initializeDatabase();
      setIsReady(true);
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : 'No se pudo iniciar SQLite.');
    }
  }, []);

  if (databaseError) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
        <Text className="text-lg font-bold text-red-700">Error al iniciar la base de datos</Text>
        <Text className="text-center mt-2" style={{ color: colors.muted }}>{databaseError}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text style={{ color: colors.muted }}>Preparando la base de datos...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}
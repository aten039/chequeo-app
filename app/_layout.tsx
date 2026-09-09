import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import '../global.css';
import { initializeDatabase } from '../src/database/database';

export default function RootLayout() {
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
      <View className="flex-1 items-center justify-center bg-slate-100 px-6">
        <Text className="text-lg font-bold text-red-700">Error al iniciar la base de datos</Text>
        <Text className="text-slate-600 text-center mt-2">{databaseError}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <Text className="text-slate-600">Preparando la base de datos...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
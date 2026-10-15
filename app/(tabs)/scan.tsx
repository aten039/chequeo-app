import { ScanLine } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';

export default function ScanScreen() {
  const { colors } = useTheme();

  // TODO: Implementar la lectura de códigos desde esta pantalla.
  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.background }}>
      <View className="flex-1 items-center justify-center px-6">
        <ScanLine color={colors.primary} size={48} />
        <Text className="text-lg font-bold mt-4" style={{ color: colors.text }}>Escáner próximamente</Text>
        <Text className="text-center mt-2" style={{ color: colors.muted }}>
          La función para escanear códigos estará disponible en una futura actualización.
        </Text>
      </View>
    </SafeAreaView>
  );
}
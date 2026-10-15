import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { CheckCircle2, Home, Package, Sparkles, Store } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCompetitorSelection } from '../../src/context/CompetitorSelectionContext';
import { listCheckedProductCodes, listCompetitors, listProducts } from '../../src/database/database';
import { useTheme } from '../../src/theme/ThemeContext';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { selectedCompetitor, setSelectedCompetitor } = useCompetitorSelection();
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [checkedCount, setCheckedCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadData = useCallback(() => {
    try {
      const products = listProducts();
      const checkedProductCodes = listCheckedProductCodes();
      const loadedCompetitors = listCompetitors();
      setCompetitors(loadedCompetitors);
      setSelectedCompetitor((current) => current && loadedCompetitors.includes(current) ? current : '');
      setProductCount(products.length);
      setCheckedCount(checkedProductCodes.length);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');
    }
  }, [setSelectedCompetitor]);

  useFocusEffect(loadData);

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-6">
          <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: colors.primaryTint }}>
            <Home color={colors.primary} size={22} />
          </View>
          <View>
            <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.muted }}>Chequeo App</Text>
            <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>Inicio</Text>
          </View>
        </View>

        <View className="rounded-2xl border p-5 mb-6" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center mb-3">
            <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primaryTint }}>
              <Sparkles color={colors.primary} size={17} />
            </View>
            <Text className="text-xs font-bold uppercase tracking-widest ml-3" style={{ color: colors.primary }}>Listo para empezar</Text>
          </View>
          <Text className="text-xl font-extrabold" style={{ color: colors.text }}>¿A quién vas a revisar hoy?</Text>
          <Text className="text-sm mt-2" style={{ color: colors.muted }}>
            Selecciona un competidor para asociarlo a tus próximos registros.
          </Text>
        </View>

        <View className="rounded-2xl border p-5 mb-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>Competidores</Text>
              <Text className="text-sm mt-1" style={{ color: colors.muted }}>Selecciona el competidor de tus próximos registros</Text>
            </View>
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primaryTint }}>
              <Store color={colors.primary} size={20} />
            </View>
          </View>

          {loadError ? (
            <Text className="text-sm" style={{ color: colors.similar }}>No se pudieron cargar los competidores: {loadError}</Text>
          ) : competitors.length === 0 ? (
            <Text className="text-sm" style={{ color: colors.muted }}>Aún no hay competidores. Carga la lista desde Gestión para empezar.</Text>
          ) : (
            competitors.map((competitor, index) => {
              const isSelected = selectedCompetitor === competitor;
              return (
                <Pressable
                  key={`${competitor}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar ${competitor}`}
                  accessibilityState={{ selected: isSelected }}
                  android_ripple={{ color: isSelected ? colors.primaryPressed : colors.border, borderless: false }}
                  onPress={() => setSelectedCompetitor(competitor)}
                  className="flex-row items-center border py-4 px-4 rounded-xl mb-3"
                  style={{
                    backgroundColor: isSelected ? colors.primary : colors.primaryTint,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }}
                >
                  <Store color={isSelected ? colors.surface : colors.primary} size={20} />
                  <Text
                    className="flex-1 font-bold ml-3"
                    style={{ color: isSelected ? colors.surface : colors.primary }}
                    numberOfLines={1}
                  >
                    {competitor}
                  </Text>
                  {isSelected && <CheckCircle2 color={colors.surface} size={20} />}
                </Pressable>
              );
            })
          )}
        </View>

        <View className="flex-row rounded-2xl border p-4 mt-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-1 flex-row items-center">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primaryTint }}>
              <Package color={colors.primary} size={19} />
            </View>
            <View>
              <Text className="text-lg font-extrabold" style={{ color: colors.text }}>{productCount}</Text>
              <Text className="text-xs" style={{ color: colors.muted }}>Productos</Text>
            </View>
          </View>
          <View className="w-px mx-3" style={{ backgroundColor: colors.border }} />
          <View className="flex-1 flex-row items-center">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.equalTint }}>
              <CheckCircle2 color={colors.equal} size={19} />
            </View>
            <View>
              <Text className="text-lg font-extrabold" style={{ color: colors.text }}>{checkedCount}</Text>
              <Text className="text-xs" style={{ color: colors.muted }}>Revisados</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

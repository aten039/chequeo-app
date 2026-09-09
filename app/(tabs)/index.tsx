import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Search, Store } from 'lucide-react-native';
import ProductCard from '../../src/components/ProductCard';
import { PriceCheck, Product } from '../../src/database/types';
import { listCompetitors, listPriceChecks, listProducts } from '../../src/database/database';
import { useTheme } from '../../src/theme/ThemeContext';

type ProgressFilter = 'Todos' | 'Pendientes' | 'Chequeados';

export default function HomeScreen() {
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalCompetitor, setGlobalCompetitor] = useState('');
  const [competitorOpen, setCompetitorOpen] = useState(false);
  const [category, setCategory] = useState('Todas');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('Todos');
  const [recordsByProduct, setRecordsByProduct] = useState<Record<string, PriceCheck[]>>({});

  const loadData = useCallback(() => {
    const loadedProducts = listProducts();
    const loadedCompetitors = listCompetitors();
    const records = listPriceChecks();
    setProducts(loadedProducts);
    setCompetitors(loadedCompetitors);
    setGlobalCompetitor((current) => current && loadedCompetitors.includes(current) ? current : loadedCompetitors[0]);
    setRecordsByProduct(records.reduce<Record<string, PriceCheck[]>>((result, record) => {
      result[String(record.productCode)] = [...(result[String(record.productCode)] ?? []), record];
      return result;
    }, {}));
  }, []);

  useFocusEffect(loadData);

  const visibleProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || `${product.code} ${product.codExt ?? ''} ${product.desc}`.toLowerCase().includes(query);
      const matchesCategory = category === 'Todas' || product.category === category;
      const isChecked = Boolean(recordsByProduct[String(product.code)]?.length);
      const matchesProgress = progressFilter === 'Todos'
        || (progressFilter === 'Chequeados' ? isChecked : !isChecked);
      return matchesSearch && matchesCategory && matchesProgress;
    });
  }, [category, products, progressFilter, recordsByProduct, searchTerm]);

  const checkedCount = Object.keys(recordsByProduct).filter((productId) => recordsByProduct[productId]?.length).length;
  const categories = ['Todas', ...Array.from(new Set(products.map((product) => product.category)))];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 pt-2 pb-1 flex-row items-center justify-between" style={{ backgroundColor: colors.surface }}>
        <Text className="text-base font-bold" style={{ color: colors.text }}>Chequeo App</Text>
        <Text className="text-[13px] font-bold" style={{ color: colors.muted }}>Progreso: {checkedCount}/{products.length}</Text>
      </View>

      <View className="px-4 pb-3" style={{ backgroundColor: colors.surface }}>
        <View className="flex-row items-center border rounded-xl px-4 py-1" style={{ backgroundColor: colors.input, borderColor: colors.border }}>
          <Search color={colors.muted} size={17} />
          <TextInput
            className="flex-1 ml-2 text-sm"
            placeholderTextColor={colors.muted}
            style={{ color: colors.text }}
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <View className="flex-row items-center mt-2 z-30" style={{ elevation: 30 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {(['Todos', 'Pendientes', 'Chequeados'] as ProgressFilter[]).map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setProgressFilter(option)}
                className="px-3 py-1 rounded-full mr-2"
                style={{ backgroundColor: progressFilter === option ? colors.primary : colors.primaryTint }}
              >
                <Text className="text-[11px] font-bold" style={{ color: progressFilter === option ? '#FFFFFF' : colors.primary }}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="w-[116px] relative" style={{ zIndex: 20 }}>
            <TouchableOpacity
              onPress={() => setCategoryOpen((open) => !open)}
              className="flex-row items-center justify-between rounded-full px-3 py-1"
              style={{ backgroundColor: colors.primaryTint }}
            >
              <Text className="text-[13px]" style={{ color: colors.primary }} numberOfLines={1}>
                {category}
              </Text>
              <ChevronDown color={colors.primary} size={14} />
            </TouchableOpacity>
            <Modal visible={categoryOpen} transparent animationType="fade" onRequestClose={() => setCategoryOpen(false)}>
              <Pressable className="flex-1 bg-black/20 justify-center items-center" onPress={() => setCategoryOpen(false)}>
                <View className="w-4/5 max-h-[300px] rounded-xl border shadow-lg overflow-hidden" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <Text className="px-4 py-3 font-bold border-b" style={{ color: colors.text, borderBottomColor: colors.border }}>Categoría</Text>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
                    {categories.map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => { setCategory(option); setCategoryOpen(false); }}
                        className="px-4 py-3 border-b"
                        style={{ borderBottomColor: colors.border }}
                      >
                        <Text className="text-[13px]" style={{ color: colors.muted }}>{option}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>

        <View className="flex-row items-center mt-2 z-20" style={{ elevation: 20 }}>
          <Store color={colors.muted} size={15} />
          <Text className="text-[13px] font-bold uppercase ml-1 mr-2" style={{ color: colors.muted }}>Competidor</Text>
          <View className="flex-1 relative" style={{ zIndex: 10 }}>
            <TouchableOpacity
              onPress={() => setCompetitorOpen((open) => !open)}
              className="flex-row items-center justify-between border-b py-1"
              style={{ borderBottomColor: colors.primary }}
            >
              <Text className="text-[13px] font-bold" style={{ color: colors.text }} numberOfLines={1}>{globalCompetitor}</Text>
              <ChevronDown color={colors.muted} size={15} />
            </TouchableOpacity>
            <Modal visible={competitorOpen} transparent animationType="fade" onRequestClose={() => setCompetitorOpen(false)}>
              <Pressable className="flex-1 bg-black/20 justify-center items-center" onPress={() => setCompetitorOpen(false)}>
                <View className="w-4/5 max-h-[320px] rounded-xl border shadow-lg overflow-hidden" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <Text className="px-4 py-3 font-bold border-b" style={{ color: colors.text, borderBottomColor: colors.border }}>Competidor</Text>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
                    {competitors.length === 0 ? (
                      <Text className="px-4 py-3" style={{ color: colors.muted }}>No hay competidores cargados</Text>
                    ) : (
                      competitors.map((competitor) => (
                        <Pressable
                          key={competitor}
                          onPress={() => {
                            setGlobalCompetitor(competitor);
                            setCompetitorOpen(false);
                          }}
                          className="px-4 py-3 border-b"
                          style={{ borderBottomColor: colors.border }}
                        >
                          <Text className="text-[13px]" style={{ color: colors.muted }}>{competitor}</Text>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>
      </View>

      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => String(item.code)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            globalCompetitor={globalCompetitor}
            records={recordsByProduct[String(item.code)] ?? []}
            onRecordsChange={(records) => setRecordsByProduct((current) => ({ ...current, [String(item.code)]: records }))}
          />
        )}
        ListEmptyComponent={<Text className="text-center mt-8" style={{ color: colors.muted }}>No hay productos con estos filtros.</Text>}
      />
    </SafeAreaView>
  );
}

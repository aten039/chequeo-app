import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Search, Store } from 'lucide-react-native';
import { useCompetitorSelection, useCompetitorSelectionActions } from '../../src/context/CompetitorSelectionContext';
import ProductCard from '../../src/components/ProductCard';
import { PriceCheck, Product } from '../../src/database/types';
import { listCheckedProductCodes, listCompetitors, listPriceChecksForProduct, listProducts } from '../../src/database/database';
import { useTheme } from '../../src/theme/ThemeContext';

type ProgressFilter = 'Todos' | 'Pendientes' | 'Chequeados';

const EMPTY_PRICE_CHECKS: PriceCheck[] = [];

function RevisionSummary({ checkedCount, productCount }: { checkedCount: number; productCount: number }) {
  const { colors } = useTheme();
  const { selectedCompetitor } = useCompetitorSelection();

  return (
    <View className="px-4 pt-2 pb-1 flex-row items-center justify-between" style={{ backgroundColor: colors.surface }}>
      <View className="flex-row items-center flex-1 mr-3">
        <Store color={colors.primary} size={17} />
        <Text className="text-base font-bold ml-2 flex-1" style={{ color: colors.text }} numberOfLines={1}>
          {selectedCompetitor || 'Selecciona un competidor en Inicio'}
        </Text>
      </View>
      <Text className="text-[13px] font-bold" style={{ color: colors.muted }}>
        Progreso: {checkedCount}/{productCount}
      </Text>
    </View>
  );
}

export default function RevisionScreen() {
  const { colors } = useTheme();
  const { setSelectedCompetitor, getSelectedCompetitor } = useCompetitorSelectionActions();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Todas');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('Todos');
  const [recordsByProduct, setRecordsByProduct] = useState<Record<string, PriceCheck[]>>({});
  const [checkedProductCodes, setCheckedProductCodes] = useState<Set<number>>(() => new Set());
  const checkedProductCodesRef = useRef(new Set<number>());
  const loadedProductCodes = useRef(new Set<number>());
  const [recordsGeneration, setRecordsGeneration] = useState(0);
  const flatListRef = useRef<FlatList<Product>>(null);
  const didMountFilters = useRef(false);

  // Carga inicial de datos desde la base de datos
  const loadData = useCallback(() => {
    const loadedProducts = listProducts();
    const loadedCompetitors = listCompetitors();
    const nextCheckedProductCodes = new Set(listCheckedProductCodes());
    const previousCheckedProductCodes = checkedProductCodesRef.current;
    const checkedProductsChanged = previousCheckedProductCodes.size !== nextCheckedProductCodes.size
      || Array.from(previousCheckedProductCodes).some((productCode) => !nextCheckedProductCodes.has(productCode));
    if (checkedProductsChanged) {
      loadedProductCodes.current.clear();
      setRecordsByProduct({});
      setRecordsGeneration((generation) => generation + 1);
    }
    checkedProductCodesRef.current = nextCheckedProductCodes;
    setProducts(loadedProducts);
    setSelectedCompetitor(
      (current) => current && loadedCompetitors.includes(current) ? current : loadedCompetitors[0] ?? '',
    );
    setCheckedProductCodes(nextCheckedProductCodes);
  }, [setSelectedCompetitor]);

  useFocusEffect(loadData);

  // Filtra los productos según los criterios de búsqueda, categoría y progreso
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || `${product.code} ${product.codExt ?? ''} ${product.desc} ${product.prov}`.toLowerCase().includes(query);
      return matchesSearch && (category === 'Todas' || product.category === category);
    });
  }, [category, products, searchTerm]);
  const visibleProducts = useMemo(() => {
    if (progressFilter === 'Todos') return filteredProducts;
    return filteredProducts.filter((product) => {
      const isChecked = checkedProductCodes.has(product.code);
      return progressFilter === 'Chequeados' ? isChecked : !isChecked;
    });
  }, [checkedProductCodes, filteredProducts, progressFilter]);
  useEffect(() => {
    if (!didMountFilters.current) {
      didMountFilters.current = true;
      return;
    }
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [category, progressFilter, searchTerm]);
  const checkedCount = checkedProductCodes.size;
  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );
  const handleRecordsNeedLoad = useCallback((productCode: number) => {
    if (loadedProductCodes.current.has(productCode)) return;
    const records = listPriceChecksForProduct(productCode);
    loadedProductCodes.current.add(productCode);
    setRecordsByProduct((current) => ({ ...current, [String(productCode)]: records }));
  }, [recordsGeneration]);
  const handleRecordsChange = useCallback((productCode: number, records: PriceCheck[]) => {
    setRecordsByProduct((current) => ({ ...current, [String(productCode)]: records }));
    if (records.length > 0) {
      checkedProductCodesRef.current.add(productCode);
      setCheckedProductCodes((current) => {
        if (current.has(productCode)) return current;
        const next = new Set(current);
        next.add(productCode);
        return next;
      });
    }
  }, []);
  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      getSelectedCompetitor={getSelectedCompetitor}
      isChecked={checkedProductCodes.has(item.code)}
      records={recordsByProduct[String(item.code)] ?? EMPTY_PRICE_CHECKS}
      onRecordsNeedLoad={handleRecordsNeedLoad}
      onRecordsChange={handleRecordsChange}
    />
  ), [checkedProductCodes, getSelectedCompetitor, handleRecordsChange, handleRecordsNeedLoad, recordsByProduct]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
      <RevisionSummary checkedCount={checkedCount} productCount={products.length} />

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

      </View>

      <FlatList
        ref={flatListRef}
        data={visibleProducts}
        keyExtractor={(item) => String(item.code)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews={false}
        renderItem={renderProduct}
        ListEmptyComponent={<Text className="text-center mt-8" style={{ color: colors.muted }}>No hay productos con estos filtros.</Text>}
      />
    </SafeAreaView>
  );
}

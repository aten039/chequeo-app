import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Search, Store } from 'lucide-react-native';
import ProductCard from '../../src/components/ProductCard';
import { PriceCheck, Product } from '../../src/database/types';
import { listCompetitors, listPriceChecks, listProducts } from '../../src/database/database';

type ProgressFilter = 'Todos' | 'Pendientes' | 'Chequeados';

export default function HomeScreen() {
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
    <SafeAreaView className="flex-1 bg-slate-100" edges={['top']}>
      <View className="bg-white px-4 pt-2 pb-1 flex-row items-center justify-between">
        <Text className="text-slate-900 text-base font-bold">Chequeo App</Text>
        <Text className="text-slate-500 text-[13px] font-bold">Progreso: {checkedCount}/{products.length}</Text>
      </View>

      <View className="bg-white px-4 pb-3">
        <View className="flex-row items-center bg-[#F4F4F4] rounded-xl px-4 py-1">
          <Search color="#94a3b8" size={17} />
          <TextInput
            className="flex-1 ml-2 text-sm text-slate-800"
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
                className={`px-3 py-1 rounded-full mr-2 ${progressFilter === option ? 'bg-blue-500' : 'bg-[#F4F4F4]'}`}
              >
                <Text className={`text-[13px] font-bold ${progressFilter === option ? 'text-white' : 'text-slate-600'}`}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="w-[116px] relative" style={{ zIndex: 20 }}>
            <TouchableOpacity
              onPress={() => setCategoryOpen((open) => !open)}
              className="flex-row items-center justify-between bg-[#F4F4F4] rounded-full px-3 py-1"
            >
              <Text className="text-slate-600 text-[13px]" numberOfLines={1}>
                {category}
              </Text>
              <ChevronDown color="#64748b" size={14} />
            </TouchableOpacity>
            <Modal visible={categoryOpen} transparent animationType="fade" onRequestClose={() => setCategoryOpen(false)}>
              <Pressable className="flex-1 bg-black/20 justify-center items-center" onPress={() => setCategoryOpen(false)}>
                <View className="w-4/5 max-h-[300px] bg-white rounded-xl border border-[#EBEBEB] shadow-lg overflow-hidden">
                  <Text className="px-4 py-3 text-slate-800 font-bold border-b border-[#EBEBEB]">Categoría</Text>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
                    {categories.map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => { setCategory(option); setCategoryOpen(false); }}
                        className="px-4 py-3 border-b border-[#EBEBEB]"
                      >
                        <Text className="text-slate-600 text-[13px]">{option}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>

        <View className="flex-row items-center mt-2 z-20" style={{ elevation: 20 }}>
          <Store color="#64748b" size={15} />
          <Text className="text-slate-500 text-[13px] font-bold uppercase ml-1 mr-2">Competidor</Text>
          <View className="flex-1 relative" style={{ zIndex: 10 }}>
            <TouchableOpacity
              onPress={() => setCompetitorOpen((open) => !open)}
              className="flex-row items-center justify-between border-b border-[#EBEBEB] py-1"
            >
              <Text className="text-slate-600 text-[13px]" numberOfLines={1}>{globalCompetitor}</Text>
              <ChevronDown color="#64748b" size={15} />
            </TouchableOpacity>
            <Modal visible={competitorOpen} transparent animationType="fade" onRequestClose={() => setCompetitorOpen(false)}>
              <Pressable className="flex-1 bg-black/20 justify-center items-center" onPress={() => setCompetitorOpen(false)}>
                <View className="w-4/5 max-h-[320px] bg-white rounded-xl border border-[#EBEBEB] shadow-lg overflow-hidden">
                  <Text className="px-4 py-3 text-slate-800 font-bold border-b border-[#EBEBEB]">Competidor</Text>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
                    {competitors.length === 0 ? (
                      <Text className="px-4 py-3 text-slate-500">No hay competidores cargados</Text>
                    ) : (
                      competitors.map((competitor) => (
                        <Pressable
                          key={competitor}
                          onPress={() => {
                            setGlobalCompetitor(competitor);
                            setCompetitorOpen(false);
                          }}
                          className="px-4 py-3 border-b border-[#EBEBEB]"
                        >
                          <Text className="text-slate-600 text-[13px]">{competitor}</Text>
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
        ListEmptyComponent={<Text className="text-slate-500 text-center mt-8">No hay productos con estos filtros.</Text>}
      />
    </SafeAreaView>
  );
}

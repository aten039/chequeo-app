import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Search, Store } from 'lucide-react-native';
import ProductCard from '../../src/components/ProductCard';
import { PriceCheck, Product } from '../../src/database/types';
import { initializeDatabase, listPriceChecks } from '../../src/database/database';

const MOCK_PRODUCTS: Product[] = [
  { code: 2208231, desc: 'BALDOSA CEMENTO GRIS MATE 60X60', prov: 'CERAMICA CARABOBO', category: '22', codExt: null },
  { code: 2412058, desc: 'LAVAMANOS DE EMPOTRAR ELSA BLA', prov: 'BINTER - LOZA', category: '24', codExt: null },
  { code: 2542232, desc: 'CARTUCHO 10" CELULOSA BLANCA', prov: 'CH AMERICAN CORP', category: '25', codExt: null },
];

const MOCK_COMPETITORS = ['Ferretería EPA', 'Preca', 'ConstruYa', 'FerreTotal'];
const MOCK_CATEGORIES = ['Todas', '22', '24', '25'];
type ProgressFilter = 'Todos' | 'Pendientes' | 'Chequeados';

export default function HomeScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [globalCompetitor, setGlobalCompetitor] = useState(MOCK_COMPETITORS[0]);
  const [competitorOpen, setCompetitorOpen] = useState(false);
  const [category, setCategory] = useState('Todas');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('Todos');
  const [recordsByProduct, setRecordsByProduct] = useState<Record<string, PriceCheck[]>>({});

  useEffect(() => {
    initializeDatabase();
    const records = listPriceChecks();
    setRecordsByProduct(records.reduce<Record<string, PriceCheck[]>>((result, record) => {
      result[String(record.productCode)] = [...(result[String(record.productCode)] ?? []), record];
      return result;
    }, {}));
  }, []);

  const visibleProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return MOCK_PRODUCTS.filter((product) => {
      const matchesSearch = !query || `${product.code} ${product.codExt ?? ''} ${product.desc}`.toLowerCase().includes(query);
      const matchesCategory = category === 'Todas' || product.category === category;
      const isChecked = Boolean(recordsByProduct[String(product.code)]?.length);
      const matchesProgress = progressFilter === 'Todos'
        || (progressFilter === 'Chequeados' ? isChecked : !isChecked);
      return matchesSearch && matchesCategory && matchesProgress;
    });
  }, [category, progressFilter, recordsByProduct, searchTerm]);

  const checkedCount = Object.keys(recordsByProduct).filter((productId) => recordsByProduct[productId]?.length).length;
  const progressPercent = MOCK_PRODUCTS.length ? (checkedCount / MOCK_PRODUCTS.length) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={['top']}>
      <View className="bg-white px-4 pt-2 pb-1">
        <Text className="text-slate-900 text-base font-bold">Chequeo App</Text>
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

        <View className="flex-row items-center mt-2 z-30">
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
                <Text className={`text-[11px] font-bold ${progressFilter === option ? 'text-white' : 'text-slate-600'}`}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="w-[92px] relative">
            <TouchableOpacity
              onPress={() => setCategoryOpen((open) => !open)}
              className="flex-row items-center justify-between bg-[#F4F4F4] rounded-full px-3 py-1"
            >
              <Text className="text-slate-600 text-[11px]" numberOfLines={1}>
                {category}
              </Text>
              <ChevronDown color="#64748b" size={14} />
            </TouchableOpacity>
            {categoryOpen && (
              <View className="absolute top-8 right-0 w-[92px] bg-white rounded-lg border border-[#EBEBEB] shadow-lg overflow-hidden">
                {MOCK_CATEGORIES.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => { setCategory(option); setCategoryOpen(false); }}
                    className="px-3 py-2 border-b border-[#EBEBEB]"
                  >
                    <Text className="text-slate-600 text-xs">{option}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        <View className="flex-row items-center mt-2 z-20">
          <Store color="#64748b" size={15} />
          <Text className="text-slate-500 text-[10px] font-bold uppercase ml-1 mr-2">Competidor</Text>
          <View className="flex-1 relative">
            <TouchableOpacity
              onPress={() => setCompetitorOpen((open) => !open)}
              className="flex-row items-center justify-between border-b border-[#EBEBEB] py-1"
            >
              <Text className="text-slate-600 text-[13px]" numberOfLines={1}>{globalCompetitor}</Text>
              <ChevronDown color="#64748b" size={15} />
            </TouchableOpacity>
            {competitorOpen && (
              <View className="absolute top-10 left-0 right-0 bg-white border border-[#EBEBEB] rounded-lg shadow-lg overflow-hidden">
                {MOCK_COMPETITORS.map((competitor) => (
                  <Pressable
                    key={competitor}
                    onPress={() => {
                      setGlobalCompetitor(competitor);
                      setCompetitorOpen(false);
                    }}
                    className="px-3 py-3 border-b border-[#EBEBEB]"
                  >
                    <Text className="text-slate-600 text-[13px]">{competitor}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="px-4 mt-4 mb-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-slate-500">Progreso: {checkedCount}/{MOCK_PRODUCTS.length}</Text>
          <Text className="text-xs text-slate-400">{visibleProducts.length} productos</Text>
        </View>
        <View className="h-[2px] bg-[#F4F4F4] rounded-full mt-2 overflow-hidden">
          <View className="h-[2px] bg-blue-500 rounded-full" style={{ width: `${progressPercent}%` }} />
        </View>
      </View>

      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => String(item.code)}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
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

import React, { memo, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Keyboard, Linking, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Edit3, Image as ImageIcon, Save } from 'lucide-react-native';
import { PriceCheck, Product } from '../database/types';
import { getProductImageLink, savePriceCheck, updatePriceCheck } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

type ProductCardProps = {
  product: Product;
  getSelectedCompetitor: () => string;
  isChecked: boolean;
  records: PriceCheck[];
  onRecordsNeedLoad: (productCode: number) => void;
  onRecordsChange: (productCode: number, records: PriceCheck[]) => void;
};

function parsePrice(value: string) {
  return Number(value.trim().replace(',', '.'));
}

function formatPrice(value: number) {
  return String(value).replace('.', ',');
}

function ProductCard({ product, getSelectedCompetitor, isChecked, records, onRecordsNeedLoad, onRecordsChange }: ProductCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [precio, setPrecio] = useState('');
  const [marca, setMarca] = useState('');
  const [status, setStatus] = useState<PriceCheck['status'] | ''>('Igual');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'unavailable' | 'error'>('idle');
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parsedPrice = parsePrice(precio);
  const isValid = precio.trim() !== '' && Number.isFinite(parsedPrice) && status !== '';
  const startImageLoad = () => {
    setImageError(null);
    setImageStatus('loading');
  };
  useEffect(() => {
    if (expanded) onRecordsNeedLoad(product.code);
  }, [expanded, onRecordsNeedLoad, product.code]);

  useEffect(() => {
    if (!expanded) {
      setImageUrl(null);
      setImageError(null);
      setImageStatus('idle');
      return;
    }

    try {
      const link = getProductImageLink(product.code)?.trim();
      if (!link) {
        setImageUrl(null);
        setImageError(null);
        setImageStatus('unavailable');
      } else if (!/^https?:\/\/\S+$/i.test(link)) {
        setImageUrl(null);
        setImageError('El enlace guardado no es una URL válida.');
        setImageStatus('error');
      } else {
        setImageUrl(link);
        startImageLoad();
      }
    } catch (error) {
      setImageUrl(null);
      setImageError(error instanceof Error ? error.message : 'No se pudo consultar el enlace de la imagen.');
      setImageStatus('error');
    }
  }, [expanded, product]);

  useEffect(() => () => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
  }, []);

  const showSaveMessage = (text: string, isError = false) => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setSaveMessage({ text, isError });
    messageTimer.current = setTimeout(() => setSaveMessage(null), 2500);
  };

  const resetForm = () => {
    setPrecio('');
    setMarca('');
    setStatus('Igual');
    setEditingId(null);
  };

  const handleGoogleSearch = async () => {
    const query = encodeURIComponent(`${product.desc} ${product.prov}`);
    const url = `https://www.google.com/search?tbm=isch&q=${query}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };
  const handleEpaSearch = async () => {
    const url = `https://ve.epaenlinea.com/catalogsearch/result/?q=${product.code}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  const handleSave = () => {
    if (!isValid) return;
    Keyboard.dismiss();
    const existingRecord = editingId === null ? undefined : records.find((item) => item.id === editingId);
    const data = {
      productCode: product.code,
      competitor: existingRecord?.competitor ?? getSelectedCompetitor(),
      price: parsedPrice,
      brand: marca.trim() || null,
      status: status as PriceCheck['status'],
    };

    try {
      if (editingId === null) {
        const record = savePriceCheck(data);
        onRecordsChange(product.code, [record, ...records]);
        showSaveMessage('Registro guardado');
      } else {
        const record = { ...data, id: editingId, createdAt: records.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString() };
        updatePriceCheck(record);
        onRecordsChange(product.code, records.map((item) => (item.id === editingId ? record : item)));
        showSaveMessage('Registro actualizado');
      }
      resetForm();
    } catch (error) {
      showSaveMessage(error instanceof Error ? error.message : 'No se pudo guardar el registro.', true);
    }
  };

  const handleEdit = (record: PriceCheck) => {
    setSaveMessage(null);
    setEditingId(record.id);
    setPrecio(formatPrice(record.price));
    setMarca(record.brand ?? '');
    setStatus(record.status);
    setExpanded(true);
  };

  const retryImage = () => {
    setImageKey((key) => key + 1);
    startImageLoad();
  };

  return (
    <View className="relative mb-3 rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.surface, borderColor: isChecked ? colors.equal : colors.border }}>
      {saveMessage && (
        <View className="absolute top-2 right-3 z-10 rounded-full px-3 py-1" style={{ backgroundColor: saveMessage.isError ? colors.similarTint : colors.equalTint }}>
          <Text className="text-xs font-bold" style={{ color: saveMessage.isError ? colors.similar : colors.equal }}>{saveMessage.text}</Text>
        </View>
      )}
      <View className="p-4 pb-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs font-bold" style={{ color: colors.muted }}>{product.code}</Text>
          <Text className="text-xs" style={{ color: colors.muted }}>Cat. {product.category} · {product.prov}</Text>
        </View>
        <Text className="font-bold text-sm" style={{ color: colors.text }}>{product.desc}</Text>
      </View>

      <View className="px-4 pb-4">
        <View className="flex-row mb-2 items-center">
          <View className="flex-1 border rounded-xl flex-row items-center px-3 h-12 mr-2" style={{ backgroundColor: colors.input, borderColor: colors.border }}>
            <Text className="font-bold mr-1" style={{ color: colors.muted }}>$</Text>
            <TextInput className="flex-1 py-2 text-base font-bold" placeholder="Precio" placeholderTextColor={colors.muted} style={{ color: colors.text }} keyboardType="numeric" value={precio} onChangeText={setPrecio} />
          </View>
          <View className="flex-1 flex-row h-12">
            {(['Igual', 'Similar'] as PriceCheck['status'][]).map((option) => (
              <TouchableOpacity key={option} onPress={() => setStatus(option)} className={`flex-1 rounded-lg border justify-center items-center ${option === 'Igual' ? 'mr-1' : ''}`} style={{ backgroundColor: status === option ? option === 'Igual' ? colors.equalTint : colors.similarTint : colors.surface, borderColor: status === option ? option === 'Igual' ? colors.equal : colors.similar : colors.border }}>
                <Text className="font-bold text-xs" style={{ color: status === option ? option === 'Igual' ? colors.equal : colors.similar : colors.muted }}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="flex-row items-center">
          <TextInput className="flex-1 border rounded-xl px-3 h-12 text-sm mr-2" style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }} placeholder="Marca encontrada (opcional)" placeholderTextColor={colors.muted} value={marca} onChangeText={setMarca} />
          <TouchableOpacity disabled={!isValid} onPress={handleSave} className="h-12 w-16 rounded-xl justify-center items-center mr-2" style={{ backgroundColor: isValid ? colors.primaryTint : colors.input }}>
            <Save color={isValid ? colors.primary : colors.muted} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExpanded(!expanded)} className="h-12 w-12 rounded-xl border justify-center items-center" style={{ backgroundColor: colors.primaryTint, borderColor: colors.border }}>
            {expanded ? <ChevronUp color={colors.primary} size={20} /> : <ChevronDown color={colors.primary} size={20} />}
          </TouchableOpacity>
        </View>
        {editingId !== null && <Text className="text-xs mt-2" style={{ color: colors.primary }}>Editando registro. Guardar actualizará este registro.</Text>}
      </View>

      {expanded && (
        <View className="px-4 pb-4 border-t pt-3" style={{ backgroundColor: colors.expanded, borderTopColor: colors.border }}>
          <View className="mx-4 mb-4 rounded-xl overflow-hidden items-center justify-center" style={{ height: 160, backgroundColor: colors.input }}>
            {imageUrl && (imageStatus === 'loading' || imageStatus === 'loaded') ? (
              <Image
                key={imageKey}
                source={{ uri: imageUrl }}
                contentFit="contain"
                cachePolicy="memory-disk"
                onLoad={() => {
                  setImageError(null);
                  setImageStatus('loaded');
                }}
                onError={(event) => {
                  setImageError(event.error || 'El servidor no pudo entregar la imagen.');
                  setImageStatus('error');
                }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : null}
            {imageStatus === 'loading' && (
              <View className="absolute items-center rounded-xl px-3 py-2" style={{ backgroundColor: colors.surface }}>
                <ActivityIndicator color={colors.primary} />
                <Text className="text-xs mt-1" style={{ color: colors.muted }}>Cargando imagen...</Text>
              </View>
            )}
            {(imageStatus === 'unavailable' || imageStatus === 'error') && (
              <View className="items-center">
                <ImageIcon color={imageStatus === 'error' ? colors.similar : colors.muted} size={28} />
                <Text className="text-xs mt-2 text-center" style={{ color: imageStatus === 'error' ? colors.similar : colors.muted }}>
                  {imageStatus === 'error' ? `Ocurrió un error al cargar la imagen. ${imageError ?? 'Error desconocido.'}` : 'No hay imagen registrada'}
                </Text>
                {imageStatus === 'error' && (
                  <Pressable onPress={retryImage} className="mt-2 rounded-lg px-3 py-2" style={{ backgroundColor: colors.primaryTint }}>
                    <Text className="text-xs font-bold" style={{ color: colors.primary }}>Reintentar</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
          <View className='flex-row justify-center gap-5 items-center'>
            <TouchableOpacity onPress={handleGoogleSearch} className="border p-3 rounded-xl flex-row justify-center items-center " style={{ backgroundColor: colors.input, borderColor: colors.border }}>
            <ImageIcon color={colors.primary} size={18} />
            <Text className="font-bold ml-2 text-sm" style={{ color: colors.primary }}>referencia en web</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEpaSearch} className="border p-3 rounded-xl flex-row justify-center items-center " style={{ backgroundColor: colors.input, borderColor: colors.border }}>
            <ImageIcon color={colors.epa} size={18} />
            <Text className="font-bold ml-2 text-sm" style={{ color: colors.epa }}>referencia en EPA</Text>
            </TouchableOpacity>
          </View>
          

          {records.length > 0 && (
            <View className="mt-3">
              <Text className="text-sm font-bold uppercase mb-2" style={{ color: colors.muted }}>Registros guardados</Text>
              {records.map((record) => (
                <View key={record.id} className="border rounded-lg p-3 mb-2 flex-row items-center justify-between" style={{ backgroundColor: colors.surface, borderColor: colors.equalTint }}>
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>${formatPrice(record.price)} · {record.competitor}</Text>
                    <Text className="text-sm" style={{ color: record.status === 'Igual' ? colors.equal : colors.similar }}>{record.status}{record.brand ? ` · ${record.brand}` : ''}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(record)} className="rounded-lg p-2" style={{ backgroundColor: colors.primaryTint }}>
                    <Edit3 color={colors.primary} size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default memo(ProductCard);

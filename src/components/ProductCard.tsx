import React, { memo, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Alert, Keyboard, Linking, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Edit3, Image as ImageIcon, Save, Trash2 } from 'lucide-react-native';
import { PriceCheck, Product } from '../database/types';
import { deletePriceCheck, listPriceChecksForProduct, savePriceCheck, updatePriceCheck } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

type ProductCardProps = {
  product: Product;
  getSelectedCompetitor: () => string;
  isChecked: boolean;
  syncVersion: number;
  onCheckedChange: (productCode: number, isChecked: boolean) => void;
};

function parsePrice(value: string) {
  return Number(value.trim().replace(',', '.'));
}

function formatPrice(value: number) {
  return String(value).replace('.', ',');
}

function ProductCard({ product, getSelectedCompetitor, isChecked, syncVersion, onCheckedChange }: ProductCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [records, setRecords] = useState<PriceCheck[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [precio, setPrecio] = useState('');
  const [marca, setMarca] = useState('');
  const [status, setStatus] = useState<PriceCheck['status'] | ''>('Igual');
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageKey, setImageKey] = useState(0);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsedPrice = parsePrice(precio);
  const isValid = precio.trim() !== '' && Number.isFinite(parsedPrice) && status !== '';

  const trimmedLink = product.link?.trim() ?? '';
  const hasLink = trimmedLink.length > 0;
  const isValidUrl = hasLink && /^https?:\/\/\S+$/i.test(trimmedLink);

  useEffect(() => {
    setImageStatus('loading');
  }, [trimmedLink]);

  useEffect(() => {
    setRecordsLoaded(false);
    if (expanded) {
      setRecords(listPriceChecksForProduct(product.code));
      setRecordsLoaded(true);
    }
  }, [syncVersion, product.code]);

  useEffect(() => {
    if (expanded && !recordsLoaded) {
      setRecords(listPriceChecksForProduct(product.code));
      setRecordsLoaded(true);
    }
  }, [expanded, recordsLoaded, product.code]);

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

    const currentRecords = recordsLoaded ? records : listPriceChecksForProduct(product.code);
    const existingRecord = editingId === null ? undefined : currentRecords.find((item) => item.id === editingId);
    const data = {
      productCode: product.code,
      competitor: getSelectedCompetitor() || existingRecord?.competitor || '',
      price: parsedPrice,
      brand: marca.trim() || null,
      status: status as PriceCheck['status'],
    };

    try {
      if (editingId === null) {
        const record = savePriceCheck(data);
        const nextRecords = [record, ...currentRecords];
        setRecords(nextRecords);
        setRecordsLoaded(true);
        onCheckedChange(product.code, true);
        showSaveMessage('Registro guardado');
      } else {
        const record = {
          ...data,
          id: editingId,
          createdAt: existingRecord?.createdAt ?? new Date().toISOString(),
        };
        updatePriceCheck(record);
        const nextRecords = currentRecords.map((item) => (item.id === editingId ? record : item));
        setRecords(nextRecords);
        setRecordsLoaded(true);
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

  const handleDelete = (record: PriceCheck) => {
    Alert.alert(
      'Eliminar registro',
      `¿Quieres eliminar el registro de ${record.competitor}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              deletePriceCheck(record.id);
              const nextRecords = records.filter((item) => item.id !== record.id);
              setRecords(nextRecords);
              onCheckedChange(product.code, nextRecords.length > 0);
              if (editingId === record.id) resetForm();
              showSaveMessage('Registro eliminado');
            } catch (error) {
              showSaveMessage(error instanceof Error ? error.message : 'No se pudo eliminar el registro.', true);
            }
          },
        },
      ],
    );
  };

  const retryImage = () => {
    setImageKey((key) => key + 1);
    setImageStatus('loading');
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

      <View className="mx-4 mb-3 rounded-xl overflow-hidden items-center justify-center" style={{ height: 160, backgroundColor: colors.input }}>
        {isValidUrl && imageStatus !== 'error' && (
          <Image
            key={imageKey}
            recyclingKey={String(product.code)}
            source={{ uri: trimmedLink }}
            contentFit="contain"
            cachePolicy="memory-disk"
            onLoad={() => setImageStatus('loaded')}
            onError={() => setImageStatus('error')}
            style={{ width: '100%', height: '100%' }}
          />
        )}
        {isValidUrl && imageStatus === 'loading' && (
          <View className="absolute items-center rounded-xl px-3 py-2" style={{ backgroundColor: colors.surface }}>
            <ActivityIndicator color={colors.primary} />
            <Text className="text-xs mt-1" style={{ color: colors.muted }}>Cargando imagen...</Text>
          </View>
        )}
        {(!hasLink || !isValidUrl || imageStatus === 'error') && (
          <View className="items-center px-3">
            <ImageIcon color={!hasLink ? colors.muted : colors.similar} size={28} />
            <Text className="text-xs mt-2 text-center" style={{ color: !hasLink ? colors.muted : colors.similar }}>
              {!hasLink
                ? 'No hay imagen registrada'
                : !isValidUrl
                  ? 'El enlace guardado no es válido'
                  : 'No se pudo cargar la imagen'}
            </Text>
            {isValidUrl && imageStatus === 'error' && (
              <Pressable onPress={retryImage} className="mt-2 rounded-lg px-3 py-2" style={{ backgroundColor: colors.primaryTint }}>
                <Text className="text-xs font-bold" style={{ color: colors.primary }}>Reintentar</Text>
              </Pressable>
            )}
          </View>
        )}
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
          <View className="flex-row justify-center gap-5 items-center">
            <TouchableOpacity onPress={handleGoogleSearch} className="border p-3 rounded-xl flex-row justify-center items-center" style={{ backgroundColor: colors.input, borderColor: colors.border }}>
              <ImageIcon color={colors.primary} size={18} />
              <Text className="font-bold ml-2 text-sm" style={{ color: colors.primary }}>referencia en web</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEpaSearch} className="border p-3 rounded-xl flex-row justify-center items-center" style={{ backgroundColor: colors.input, borderColor: colors.border }}>
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
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      accessibilityLabel="Modificar registro"
                      onPress={() => handleEdit(record)}
                      className="rounded-lg p-2 mr-2"
                      style={{ backgroundColor: colors.primaryTint }}
                    >
                      <Edit3 color={colors.primary} size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel="Eliminar registro"
                      onPress={() => handleDelete(record)}
                      className="rounded-lg p-2"
                      style={{ backgroundColor: colors.similarTint }}
                    >
                      <Trash2 color={colors.similar} size={16} />
                    </TouchableOpacity>
                  </View>
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
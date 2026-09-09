import React, { useEffect, useRef, useState } from 'react';
import { Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Edit3, Image as ImageIcon, Save } from 'lucide-react-native';
import { PriceCheck, Product } from '../database/types';
import { savePriceCheck, updatePriceCheck } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

type ProductCardProps = {
  product: Product;
  globalCompetitor: string;
  records: PriceCheck[];
  onRecordsChange: (records: PriceCheck[]) => void;
};

export default function ProductCard({ product, globalCompetitor, records, onRecordsChange }: ProductCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [precio, setPrecio] = useState('');
  const [marca, setMarca] = useState('');
  const [status, setStatus] = useState<PriceCheck['status'] | ''>('');
  const [notas, setNotas] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isValid = precio.trim() !== '' && status !== '';

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
    setStatus('');
    setNotas('');
    setEditingId(null);
  };

  const handleGoogleSearch = async () => {
    const query = encodeURIComponent(`${product.desc} ${product.prov}`);
    const url = `https://www.google.com/search?tbm=isch&q=${query}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  const handleSave = () => {
    if (!isValid) return;
    const data = {
      productCode: product.code,
      competitor: globalCompetitor,
      price: Number(precio),
      brand: marca.trim() || null,
      status: status as PriceCheck['status'],
      notes: notas.trim() || null,
    };

    try {
      if (editingId === null) {
        const record = savePriceCheck(data);
        onRecordsChange([record, ...records]);
        showSaveMessage('Registro guardado');
      } else {
        const record = { ...data, id: editingId, createdAt: records.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString() };
        updatePriceCheck(record);
        onRecordsChange(records.map((item) => (item.id === editingId ? record : item)));
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
    setPrecio(String(record.price));
    setMarca(record.brand ?? '');
    setStatus(record.status);
    setNotas(record.notes ?? '');
    setExpanded(true);
  };

  return (
    <View className="relative mb-3 rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.surface, borderColor: records.length ? colors.equal : colors.border }}>
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
          <TextInput className="border rounded-xl px-3 py-3 text-sm mb-3" style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.text }} placeholder="Notas u observaciones (opcional)" placeholderTextColor={colors.muted} multiline value={notas} onChangeText={setNotas} />
          <TouchableOpacity onPress={handleGoogleSearch} className="border py-3 rounded-xl flex-row justify-center items-center" style={{ backgroundColor: colors.input, borderColor: colors.border }}>
            <ImageIcon color={colors.primary} size={18} />
            <Text className="font-bold ml-2 text-sm" style={{ color: colors.primary }}>Ver imagen de referencia en web</Text>
          </TouchableOpacity>

          {records.length > 0 && (
            <View className="mt-3">
              <Text className="text-sm font-bold uppercase mb-2" style={{ color: colors.muted }}>Registros guardados</Text>
              {records.map((record) => (
                <View key={record.id} className="border rounded-lg p-3 mb-2 flex-row items-center justify-between" style={{ backgroundColor: colors.surface, borderColor: colors.equalTint }}>
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>${record.price} · {record.competitor}</Text>
                    <Text className="text-sm" style={{ color: record.status === 'Igual' ? colors.equal : colors.similar }}>{record.status}{record.brand ? ` · ${record.brand}` : ''} · {record.notes && <Text className="text-sm mt-1 text-wrap" style={{ color: colors.muted }}>{record.notes}</Text>}</Text>
                    
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

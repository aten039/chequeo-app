import React, { useState } from 'react';
import { Alert, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Edit3, Image as ImageIcon, Save } from 'lucide-react-native';
import { PriceCheck, Product } from '../database/types';
import { savePriceCheck, updatePriceCheck } from '../database/database';
import { formatShortDate } from '../services/csv';

type ProductCardProps = {
  product: Product;
  globalCompetitor: string;
  records: PriceCheck[];
  onRecordsChange: (records: PriceCheck[]) => void;
};

export default function ProductCard({ product, globalCompetitor, records, onRecordsChange }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [precio, setPrecio] = useState('');
  const [marca, setMarca] = useState('');
  const [status, setStatus] = useState<PriceCheck['status'] | ''>('');
  const [notas, setNotas] = useState('');
  const isValid = precio.trim() !== '' && status !== '';

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

    if (editingId === null) {
      const record = savePriceCheck(data);
      onRecordsChange([record, ...records]);
      Alert.alert('Registro guardado', 'Se agregó un nuevo chequeo.');
    } else {
      const record = { ...data, id: editingId, createdAt: records.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString() };
      updatePriceCheck(record);
      onRecordsChange(records.map((item) => (item.id === editingId ? record : item)));
      Alert.alert('Registro actualizado', 'Los cambios fueron guardados.');
    }
    resetForm();
  };

  const handleEdit = (record: PriceCheck) => {
    setEditingId(record.id);
    setPrecio(String(record.price));
    setMarca(record.brand ?? '');
    setStatus(record.status);
    setNotas(record.notes ?? '');
    setExpanded(true);
  };

  return (
    <View className={`bg-white mb-3 rounded-2xl border overflow-hidden ${records.length ? 'border-green-500' : 'border-slate-200'}`}>
      <View className="p-4 pb-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-slate-400 text-xs font-bold">{product.code}</Text>
          <Text className="text-slate-400 text-xs">Cat. {product.category} · {product.prov}</Text>
        </View>
        <Text className="font-bold text-slate-800 text-sm">{product.desc}</Text>
      </View>

      <View className="px-4 pb-4">
        <View className="flex-row mb-2 items-center">
          <View className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex-row items-center px-3 h-12 mr-2">
            <Text className="text-slate-400 font-bold mr-1">$</Text>
            <TextInput className="flex-1 py-2 text-base font-bold text-slate-800" placeholder="Precio" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
          </View>
          <View className="flex-1 flex-row h-12">
            {(['Igual', 'Similar'] as PriceCheck['status'][]).map((option) => (
              <TouchableOpacity key={option} onPress={() => setStatus(option)} className={`flex-1 rounded-lg border justify-center items-center ${status === option ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'} ${option === 'Igual' ? 'mr-1' : ''}`}>
                <Text className={`font-bold text-xs ${status === option ? 'text-white' : 'text-slate-500'}`}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="flex-row items-center">
          <TextInput className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 text-sm text-slate-800 mr-2" placeholder="Marca encontrada (opcional)" value={marca} onChangeText={setMarca} />
          <TouchableOpacity disabled={!isValid} onPress={handleSave} className={`h-12 w-16 rounded-xl justify-center items-center mr-2 ${isValid ? 'bg-green-600' : 'bg-slate-200'}`}>
            <Save color={isValid ? 'white' : '#94a3b8'} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExpanded(!expanded)} className="h-12 w-12 bg-slate-100 rounded-xl border border-slate-200 justify-center items-center">
            {expanded ? <ChevronUp color="#475569" size={20} /> : <ChevronDown color="#475569" size={20} />}
          </TouchableOpacity>
        </View>
        {editingId !== null && <Text className="text-blue-600 text-xs mt-2">Editando registro. Guardar actualizará este registro.</Text>}
      </View>

      {expanded && (
        <View className="px-4 pb-4 border-t border-slate-100 pt-3 bg-slate-50">
          <TextInput className="bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm mb-3" placeholder="Notas u observaciones (opcional)" multiline value={notas} onChangeText={setNotas} />
          <TouchableOpacity onPress={handleGoogleSearch} className="bg-white border border-slate-300 py-3 rounded-xl flex-row justify-center items-center">
            <ImageIcon color="#2563eb" size={18} />
            <Text className="text-blue-600 font-bold ml-2 text-sm">Ver imagen de referencia en web</Text>
          </TouchableOpacity>

          {records.length > 0 && (
            <View className="mt-3">
              <Text className="text-slate-500 text-sm font-bold uppercase mb-2">Registros guardados</Text>
              {records.map((record) => (
                <View key={record.id} className="bg-white border border-green-200 rounded-lg p-3 mb-2 flex-row items-center justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-slate-800 text-sm font-bold">${record.price} · {record.competitor}</Text>
                    <Text className="text-slate-500 text-sm">{record.status}{record.brand ? ` · ${record.brand}` : ''} · {record.notes && <Text className="text-slate-500 text-sm mt-1 text-wrap">{record.notes}</Text>}</Text>
                    
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(record)} className="bg-blue-50 rounded-lg p-2">
                    <Edit3 color="#2563eb" size={16} />
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

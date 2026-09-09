import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Database, Download, Upload } from 'lucide-react-native';

export default function GestionScreen() {
  const showComingSoon = (action: string) => Alert.alert(action, 'Esta acción estará disponible con la persistencia local.');

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4">
      <View className="bg-white rounded-2xl p-6 border border-slate-200 mb-4">
        <View className="flex-row items-center mb-4">
          <Database color="#2563eb" size={24} />
          <Text className="text-lg font-bold text-slate-800 ml-2">Sincronización local</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-6">
          Sube archivos CSV separados por coma (,). El archivo de productos debe tener las columnas código, descripción, proveedor y categoría; el de competidores debe tener nombre.
        </Text>
        <TouchableOpacity
          onPress={() => showComingSoon('Cargar productos')}
          className="bg-slate-50 border border-slate-300 py-4 rounded-xl flex-row justify-center items-center mb-3"
        >
          <Upload color="#475569" size={20} />
          <Text className="text-slate-700 font-bold ml-2">1. Cargar Productos.csv</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => showComingSoon('Cargar competidores')}
          className="bg-slate-50 border border-slate-300 py-4 rounded-xl flex-row justify-center items-center"
        >
          <Upload color="#475569" size={20} />
          <Text className="text-slate-700 font-bold ml-2">2. Cargar Competidores.csv</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white rounded-2xl p-6 border border-slate-200">
        <Text className="text-lg font-bold text-slate-800 mb-2">Exportar al finalizar</Text>
        <Text className="text-slate-500 text-sm mb-6">
          Genera un CSV delimitado por punto y coma (;), con código, competidor, precio, marca, estado, observación y fecha en formato DD/MM/AAAA.
        </Text>
        <TouchableOpacity
          onPress={() => showComingSoon('Exportar resultados')}
          className="bg-slate-800 py-4 rounded-xl flex-row justify-center items-center"
        >
          <Download color="white" size={20} />
          <Text className="text-white font-bold ml-2">Exportar resultados (CSV)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

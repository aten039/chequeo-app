import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Database, Download, Trash2, Upload } from 'lucide-react-native';
import { clearDatabase, initializeDatabase, listPriceChecks, replaceCompetitors, replaceProducts } from '../../src/database/database';
import { parseCompetitorsCsv, parseProductsCsv, priceChecksToCsv } from '../../src/services/csv';

export default function GestionScreen() {
  const [loading, setLoading] = useState(false);

  const pickCsv = async () => {
    const result = await File.pickFileAsync({
      mimeTypes: ['text/csv', 'text/comma-separated-values', 'text/plain'],
      multipleFiles: false,
    });
    if (result.canceled) return null;
    const bytes = await result.result.bytes();
    return new TextDecoder('utf-8').decode(bytes);
  };

  const handleProductsImport = async () => {
    try {
      setLoading(true);
      const csv = await pickCsv();
      if (!csv) return;
      const products = parseProductsCsv(csv);
      initializeDatabase();
      replaceProducts(products);
      Alert.alert('Productos cargados', `Se guardaron ${products.length} productos.`);
    } catch (error) {
      Alert.alert('Error al cargar productos', error instanceof Error ? error.message : 'No se pudo leer el archivo seleccionado.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompetitorsImport = async () => {
    try {
      setLoading(true);
      const csv = await pickCsv();
      if (!csv) return;
      const competitors = parseCompetitorsCsv(csv);
      initializeDatabase();
      replaceCompetitors(competitors.map((item) => item.name));
      Alert.alert('Competidores cargados', `Se guardaron ${competitors.length} competidores.`);
    } catch (error) {
      Alert.alert('Error al cargar competidores', error instanceof Error ? error.message : 'No se pudo leer el archivo seleccionado.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      initializeDatabase();
      const csv = priceChecksToCsv(listPriceChecks());
      if (!FileSystem.documentDirectory) throw new Error('No existe un directorio local para exportar.');
      const uri = `${FileSystem.documentDirectory}chequeo-resultados.csv`;
      await FileSystem.writeAsStringAsync(uri, `\uFEFF${csv}`, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Compartir resultados CSV' });
      } else {
        Alert.alert('CSV generado', uri);
      }
    } catch (error) {
      Alert.alert('Error al exportar', error instanceof Error ? error.message : 'No se pudo generar el CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = () => {
    Alert.alert(
      'Borrar toda la información',
      'Se eliminarán productos, competidores y registros de precios. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: () => {
            initializeDatabase();
            clearDatabase();
            Alert.alert('Base de datos reiniciada', 'Ya puedes cargar nuevamente los productos y competidores.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4" >
      <View className="bg-white rounded-2xl p-6 border border-slate-200 mb-4">
        <View className="flex-row items-center mb-4">
          <Database color="#2563eb" size={24} />
          <Text className="text-lg font-bold text-slate-800 ml-2">Sincronización local</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-6">
          Sube archivos CSV separados por coma (,) o punto y coma (;), con o sin encabezados. Siguiendo el orden de columnas que se indica a continuación:
        </Text>
        <Text className="text-slate-500 text-sm mb-6">
        productos: Categoría - Código - Código Externo (opcional) - Descripción - Proveedor.
        </Text>
        <Text className="text-slate-500 text-sm mb-6">
            competidores: Nombre.
        </Text>
        <TouchableOpacity
          onPress={handleProductsImport}
          disabled={loading}
          className="bg-slate-50 border border-slate-300 py-4 rounded-xl flex-row justify-center items-center mb-3"
        >
          <Upload color="#475569" size={20} />
          <Text className="text-slate-700 font-bold ml-2">1. Cargar Productos.csv</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCompetitorsImport}
          disabled={loading}
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
          onPress={handleExport}
          disabled={loading}
          className="bg-slate-800 py-4 rounded-xl flex-row justify-center items-center"
        >
          <Download color="white" size={20} />
          <Text className="text-white font-bold ml-2">Exportar resultados (CSV)</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white rounded-2xl p-6 border border-red-200 mt-4">
        <View className="flex-row items-center mb-2">
          <Trash2 color="#dc2626" size={20} />
          <Text className="text-base font-bold text-slate-800 ml-2">Reiniciar información</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">
          Elimina todos los productos, competidores y registros para comenzar una carga nueva.
        </Text>
        <TouchableOpacity
          onPress={handleClearDatabase}
          className="bg-red-50 border border-red-200 py-4 rounded-xl flex-row justify-center items-center"
        >
          <Trash2 color="#dc2626" size={20} />
          <Text className="text-red-700 font-bold ml-2">Borrar toda la información</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

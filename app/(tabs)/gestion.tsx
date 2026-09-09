import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Database, Download, Moon, Sun, Trash2, Upload } from 'lucide-react-native';
import { clearDatabase, initializeDatabase, listPriceChecks, replaceCompetitors, replaceProducts } from '../../src/database/database';
import { parseCompetitorsCsv, parseProductsCsv, priceChecksToCsv } from '../../src/services/csv';
import { useTheme } from '../../src/theme/ThemeContext';

export default function GestionScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
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
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 110 }} style={{ backgroundColor: colors.background }}>
      <TouchableOpacity onPress={toggleTheme} className="mb-4 py-3 rounded-xl flex-row justify-center items-center" style={{ backgroundColor: colors.primaryTint }}>
        {isDark ? <Sun color={colors.primary} size={20} /> : <Moon color={colors.primary} size={20} />}
        <Text className="font-bold ml-2" style={{ color: colors.primary }}>{isDark ? 'Activar modo claro' : 'Activar modo oscuro'}</Text>
      </TouchableOpacity>

      <View className="rounded-2xl p-6 border mb-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="flex-row items-center mb-4">
          <Database color={colors.primary} size={24} />
          <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>Sincronización local</Text>
        </View>
        <Text className="text-sm mb-6" style={{ color: colors.muted }}>
          Sube archivos CSV separados por coma (,) o punto y coma (;), con o sin encabezados. Siguiendo el orden de columnas que se indica a continuación:
        </Text>
        <Text className="text-sm mb-6" style={{ color: colors.muted }}>
        productos: Categoría - Código - Código Externo (opcional) - Descripción - Proveedor.
        </Text>
        <Text className="text-sm mb-6" style={{ color: colors.muted }}>
            competidores: Nombre.
        </Text>
        <TouchableOpacity
          onPress={handleProductsImport}
          disabled={loading}
          className="border py-4 rounded-xl flex-row justify-center items-center mb-3"
          style={{ backgroundColor: colors.primaryTint, borderColor: colors.border }}
        >
          <Upload color={colors.primary} size={20} />
          <Text className="font-bold ml-2" style={{ color: colors.primary }}>1. Cargar Productos.csv</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCompetitorsImport}
          disabled={loading}
          className="border py-4 rounded-xl flex-row justify-center items-center"
          style={{ backgroundColor: colors.primaryTint, borderColor: colors.border }}
        >
          <Upload color={colors.primary} size={20} />
          <Text className="font-bold ml-2" style={{ color: colors.primary }}>2. Cargar Competidores.csv</Text>
        </TouchableOpacity>
      </View>

      <View className="rounded-2xl p-6 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>Exportar al finalizar</Text>
        <Text className="text-sm mb-6" style={{ color: colors.muted }}>
          Genera un CSV delimitado por punto y coma (;), con código, competidor, precio, marca, estado, observación y fecha en formato DD/MM/AAAA.
        </Text>
        <TouchableOpacity
          onPress={handleExport}
          disabled={loading}
          className="py-4 rounded-xl flex-row justify-center items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Download color="white" size={20} />
          <Text className="text-white font-bold ml-2">Exportar resultados (CSV)</Text>
        </TouchableOpacity>
      </View>

      <View className="rounded-2xl p-6 border mt-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="flex-row items-center mb-2">
          <Trash2 color="#dc2626" size={20} />
          <Text className="text-base font-bold ml-2" style={{ color: colors.text }}>Reiniciar información</Text>
        </View>
        <Text className="text-sm mb-4" style={{ color: colors.muted }}>
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

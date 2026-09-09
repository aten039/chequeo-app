# Chequeo-precios - Guia de arquitectura para agentes

## Objetivo

Aplicacion Expo para revisar precios de productos contra competidores, con datos locales y funcionamiento offline.

## Estructura

```text
app/
  _layout.tsx                 # Stack raiz de Expo Router
  (tabs)/
    _layout.tsx               # Navegacion inferior
    index.tsx                 # Revision y busqueda de productos
    gestion.tsx               # Importacion y exportacion de datos
src/
  components/                 # Componentes visuales reutilizables
  database/                   # SQLite, tipos y repositorios
    database.ts
    types.ts
  services/                   # CSV, transformaciones e integraciones
    csv.ts
global.css                    # Entrada de Tailwind/NativeWind
metro.config.js               # Integracion de NativeWind con Metro
tailwind.config.js            # Fuentes de clases y preset NativeWind
babel.config.js               # Babel de Expo y NativeWind
```

## Reglas de arquitectura

- Las rutas de `app/` coordinan navegacion y estado de pantalla; no deben contener SQL ni parseo CSV.
- Los componentes de `src/components/` deben ser reutilizables y recibir datos por props.
- Toda operacion SQLite pertenece a `src/database/`. Usa `types.ts` para contratos compartidos.
- Toda lectura, validacion o exportacion CSV pertenece a `src/services/`.
- Mantener la aplicacion offline-first: la UI puede trabajar con datos locales y la persistencia debe ser explicita.
- No mezclar logica de infraestructura con estilos o JSX si puede vivir en una capa inferior.
- No borrar cambios existentes del usuario. Hacer cambios pequenos y compatibles con las APIs publicas actuales.

## NativeWind y estilos

- Usar `className` en componentes React Native cuando el estilo sea estatico o utilitario.
- Mantener `global.css`, `metro.config.js`, `tailwind.config.js` y `babel.config.js` sincronizados.
- `tailwind.config.js` debe conservar `nativewind/preset` y los paths de `app` y `src`.
- Para estilos calculados o componentes complejos se permite `StyleSheet.create`.
- Tras cambiar configuracion de estilos, ejecutar `npx expo start -c` o limpiar la cache de Metro.

## Navegacion

- Expo Router usa rutas basadas en archivos.
- `(tabs)` es un grupo de rutas y no forma parte de la URL.
- Las nuevas pantallas principales deben registrarse en `app/(tabs)/_layout.tsx`.
- No usar `TabNavigator`; la API instalada es `Tabs`.

## Base de datos

- Inicializar SQLite antes de realizar consultas con `initializeDatabase()`.
- Usar parametros en consultas; nunca interpolar valores del usuario en SQL.
- Mantener nombres de dominio en `src/database/types.ts` y mapear nombres SQL en los repositorios.
- La marca de un registro es opcional (`string | null`); no bloquear el guardado por ausencia de marca.
- Los productos incluyen `category`, cargada desde el CSV y usada por los filtros de la pantalla de revisión.
- Las migraciones deben ser idempotentes y usar `CREATE TABLE IF NOT EXISTS` o una version de esquema controlada.

## CSV

- Los CSV del proyecto usan `;` como separador.
- Validar encabezados y filas antes de persistir informacion.
- No asumir que un archivo tiene codificacion perfecta; manejar BOM y saltos de linea CRLF.
- Mantener funciones de parseo puras y faciles de probar.

## Flujo de trabajo para IA

1. Leer este archivo y localizar primero el modulo que controla el comportamiento solicitado.
2. Formular una hipotesis local y una comprobacion pequena antes de editar.
3. Revisar los archivos relacionados y respetar cambios no realizados por el agente.
4. Aplicar el cambio minimo con el estilo existente.
5. Ejecutar inmediatamente una validacion enfocada despues de la primera edicion.
6. Para cambios de TypeScript, ejecutar `npx tsc --noEmit`.
7. Para cambios de Expo o Babel, ejecutar `npx expo export --platform android` o iniciar Expo.
8. Para cambios de NativeWind, comprobar configuracion, limpiar cache y verificar una pantalla real.
9. No ejecutar `npm audit fix --force` ni actualizar dependencias sin una razon concreta.
10. No crear commits ni ramas salvo peticion expresa.

## Comandos

- `npm install`: instalar dependencias.
- `npx tsc --noEmit`: validar TypeScript.
- `npx expo export --platform android`: validar el bundle Android.
- `npx expo start --tunnel`: iniciar Expo Go mediante tunel.
- `npx expo start -c`: iniciar limpiando cache de Metro.

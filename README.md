# chequeo-app

## Ejecutar en el movil

Instala Expo Go en el telefono y ejecuta:

```bash
npm run mobile
```

Escanea el QR desde Expo Go. El telefono y el contenedor deben tener acceso a internet.

## Crear instalables

Inicia sesion en Expo una vez:

```bash
eas login
```

Genera una APK instalable para Android:

```bash
npm run build:android
```

Genera un build para iOS:

```bash
npm run build:ios
```

Para produccion en Android e iOS:

```bash
npm run build:production
```

Los builds requieren una cuenta Expo. Los builds iOS requieren ademas una cuenta Apple Developer. EAS solicitara las credenciales y certificados cuando sean necesarios.

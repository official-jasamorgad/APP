# JASAMORGAD — Panduan Build Mobile App (Android APK & iOS IPA)

Aplikasi web JASAMORGAD sudah **PWA-ready** dan bisa langsung di-install seperti apk di HP tanpa Play Store / App Store. Untuk publish resmi ke store, ikuti opsi Capacitor di bawah.

---

## Opsi 1 — PWA (Rekomendasi cepat)

**Tidak butuh setup apa pun.** Cukup:

### Android (Chrome)
1. Buka https://marketplace-hub-1550.preview.emergentagent.com di Chrome
2. Tap **⋮ (menu titik-tiga) → Install app** *(atau muncul otomatis banner "Add to Home Screen")*
3. Ikon JASAMORGAD muncul di homescreen, buka seperti apk biasa (fullscreen, offline).

### iOS (Safari)
1. Buka website di **Safari** (bukan Chrome — Apple hanya izinkan install dari Safari)
2. Tap tombol **Share** (kotak dengan panah ke atas) → **Add to Home Screen** → **Add**
3. Ikon muncul di Home Screen iPhone.

Kelebihan PWA:
- ✅ Update otomatis (tinggal reload)
- ✅ Splash screen, ikon, tema
- ✅ Offline (halaman yang pernah dibuka)
- ✅ Notifikasi push (opsional, butuh setup lanjutan)
- ✅ Tidak perlu bayar $25 Play Console / $99/tahun Apple Developer

Kekurangan: tidak muncul di Play Store / App Store (hanya install langsung).

---

## Opsi 2 — Native APK / IPA via Capacitor

Untuk publish ke Play Store & App Store.

### Prasyarat (di komputer Anda, bukan environment cloud ini)
- Node 18+, Yarn
- **Android**: JDK 17 + [Android Studio](https://developer.android.com/studio)
- **iOS**: macOS + [Xcode 15+](https://apps.apple.com/us/app/xcode/id497799835)

### Setup awal (satu kali)

```bash
cd /path/to/jasamorgad/frontend
yarn add @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
yarn build

# Init dengan config yang sudah tersedia (capacitor.config.js)
npx cap add android
npx cap add ios
npx cap sync
```

### Setiap kali update kode
```bash
yarn build
npx cap sync
```

### Build Android APK
```bash
npx cap open android
# Di Android Studio: Build → Generate Signed Bundle / APK → APK → Release
# Signing key: buat baru atau pakai yang sudah ada
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Build iOS IPA
```bash
npx cap open ios
# Di Xcode: Signing & Capabilities → pilih Team (Apple Developer Account)
# Product → Archive → Distribute App → App Store Connect
```

### Publish
- **Play Store**: https://play.google.com/console — biaya $25 satu kali
- **App Store**: https://developer.apple.com/programs — biaya $99/tahun

---

## Tips
- Konfigurasi backend URL sudah di-hardcode di `capacitor.config.js` → menunjuk ke hosted backend. Kalau backend Anda pindah domain, update file itu.
- Untuk push notifications native, install `@capacitor/push-notifications` lalu setup Firebase Cloud Messaging (Android) / APNs (iOS).
- Ikon app: taruh `icon-512.png` di `frontend/public/` lalu jalankan `npx @capacitor/assets generate`.

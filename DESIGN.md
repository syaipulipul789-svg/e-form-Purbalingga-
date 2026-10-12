# Panduan Desain & UI/UX: E-Form Kabupaten Purbalingga

Dokumen ini mendefinisikan sistem desain (Design System), filosofi estetika **Neobrutalism**, token warna, tipografi, dan panduan komponen untuk aplikasi **E-Form Kabupaten Purbalingga**.

---

## 1. Filosofi Desain: "Purbalingga Modern Neobrutalism"

Neobrutalism memadukan ketegasan garis brutalist (border hitam tebal, bayangan solid kaku, kontras tinggi) dengan sentuhan modern ramah pengguna (warna cerah yang harmonis, sudut sedikit membulat, dan mikro-animasi responsif).

Dalam konteks pelayanan publik Kabupaten Purbalingga, tema ini memberikan keuntungan:
1. **Kejelasan Maksimal (High Readability & Contrast):** Elemen formulir sangat mudah dibaca oleh semua kalangan masyarakat tanpa bias tipis yang membingungkan.
2. **Kesan Modern & Transparan:** Jauh dari kesan aplikasi birokrasi lawas yang kaku dan monoton.
3. **Sentuhan Identitas Lokal:** Memadukan warna hijau perbukitan Purbalingga (Gunung Slamet) dengan kuning cerah energi pelayanan masyarakat.

---

## 2. Aturan Wajib Interaktivitas (Cursor Pointer Policy)

> [!IMPORTANT]
> **ATURAN WAJIB SISTEM:**
> Setiap elemen yang dapat diklik atau memiliki event interaktif **WAJIB** memiliki properti `cursor-pointer`:
> - Seluruh elemen tombol (`<button>`, custom button, icon button).
> - Seluruh tautan navigasi (`<a>`, Next.js `<Link>`).
> - Komponen input interaktif: `checkbox`, `radio button`, `toggle switch`, `dropdown trigger`.
> - Tab switcher, pill filter, modal backdrop close, dan accordion header.
> - Baris tabel respons yang dapat dibuka detailnya.

---

## 3. Token Desain (Design Tokens)

### 3.1. Palet Warna (Color Palette)

| Nama Token | Hex Code | Tailwind Utility | Peran & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#FFFDF8` | `bg-[#FFFDF8]` | Latar belakang utama aplikasi (hangat & nyaman di mata) |
| **Ink Black (Border/Text)** | `#121212` | `border-black text-black` | Border tebal (2px/3px), teks judul, dan hard shadow |
| **Purbalingga Green** | `#059669` | `bg-emerald-600` | Warna utama identitas daerah, tombol submit/simpan |
| **Sunburst Yellow** | `#FFE600` | `bg-[#FFE600]` | Aksen perhatian tinggi, kartu sorotan, badge aktif |
| **Electric Sky** | `#38BDF8` | `bg-sky-400` | Aksen info, kategori form, tombol preview builder |
| **Vibrant Coral** | `#FF5C5C` | `bg-rose-500` | Status ditutup, tombol hapus/reset, badge required |
| **Soft Lilac** | `#C4B5FD` | `bg-purple-300` | Tag kategori dinas/OPD, kartu statistik sekunder |
| **Pure White** | `#FFFFFF` | `bg-white` | Latar kartu formulir & input field |

### 3.2. Bayangan Neobrutalism (Hard Drop Shadows)

Tidak menggunakan blur shadow standar. Semua bayangan berupa bidang datar hitam pekat (`#121212`):

- **Shadow Standar (Kartu & Panel):**
  `shadow-[4px_4px_0px_#121212]`
- **Shadow Besar (Modal, Header Banner, Hero Card):**
  `shadow-[6px_6px_0px_#121212]`
- **Shadow Kecil (Badge, Tombol Mungil):**
  `shadow-[2px_2px_0px_#121212]`
- **Interaksi Hover & Active (Efek Tombol Timbul/Ditekan):**
  - Normal: `shadow-[4px_4px_0px_#121212] translate-x-0 translate-y-0`
  - Hover: `hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#121212]`
  - Active / Pressed: `active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`

### 3.3. Border & Radius
- **Tebal Border:** `border-2 border-black` (pada input & kartu umum) atau `border-3 border-black` (pada tombol aksi utama).
- **Sudut (Border Radius):** `rounded-md` (6px) atau `rounded-lg` (8px) untuk memberikan kesan ramah modern tanpa menghilangkan ketegasan brutalist.

### 3.4. Tipografi
- **Font Utama (Teks & Antarmuka):** `Plus Jakarta Sans` atau `Outfit` (Sans-Serif tebal, bersih, geometri modern).
- **Font Monospace (Kode, NIK, Timestamp, Token):** `Space Mono` atau `JetBrains Mono`.
- **Hierarki:**
  - H1 Judul Form: `text-3xl font-extrabold tracking-tight md:text-4xl`
  - H2 Judul Seksi: `text-xl font-bold tracking-tight md:text-2xl`
  - Label Pertanyaan: `text-base font-bold text-black`
  - Deskripsi / Bantuan: `text-sm font-medium text-neutral-700`

---

## 4. Spesifikasi Komponen Inti

### 4.1. Tombol (Buttons)

#### Primary Button (Simpan / Kirim Formulir)
```tsx
<button
  type="submit"
  className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FFE600] text-black font-extrabold text-base border-2 border-black rounded-md shadow-[4px_4px_0px_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#121212] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
>
  Kirim Formulir
</button>
```

#### Secondary / Action Button (Tambah Pertanyaan di Builder)
```tsx
<button
  type="button"
  className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-bold text-sm border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#121212] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
>
  + Tambah Field Baru
</button>
```

#### Danger Button (Hapus Form / Pertanyaan)
```tsx
<button
  type="button"
  className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 bg-[#FF5C5C] text-white font-bold text-xs border-2 border-black rounded-md shadow-[2px_2px_0px_#121212] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
>
  Hapus
</button>
```

---

### 4.2. Input Field & Kontrol Formulir

#### Text Input & Textarea
```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-extrabold text-black flex items-center gap-1">
    Nama Lengkap Sesuai KTP <span className="text-rose-600">*</span>
  </label>
  <input
    type="text"
    placeholder="Masukkan nama lengkap Anda..."
    className="w-full px-4 py-2.5 bg-white text-black text-sm font-medium border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] focus:outline-none focus:ring-2 focus:ring-[#FFE600] transition-all placeholder:text-neutral-400"
  />
  <span className="text-xs font-semibold text-neutral-600">Pastikan nama sesuai dengan e-KTP.</span>
</div>
```

#### Radio & Checkbox
```tsx
<label className="cursor-pointer inline-flex items-center gap-3 p-3 bg-white border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] hover:bg-neutral-50 transition-all">
  <input
    type="radio"
    name="layanan"
    className="cursor-pointer w-5 h-5 accent-emerald-600 border-2 border-black"
  />
  <span className="text-sm font-bold text-black">Permohonan Surat Keterangan</span>
</label>
```

---

### 4.3. Komponen Spesial: Wilayah Purbalingga (Kecamatan & Desa Chaining)

Komponen ini dirancang secara khusus untuk kebutuhan Kabupaten Purbalingga dengan tampilan Neobrutalis:

```tsx
<div className="p-5 bg-[#F0FDF4] border-2 border-black rounded-lg shadow-[4px_4px_0px_#121212] flex flex-col gap-4">
  {/* Header Badge */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-0.5 bg-[#059669] text-white font-extrabold text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_#000]">
        Wilayah Purbalingga
      </span>
      <h3 className="text-base font-extrabold text-black">Pilih Kecamatan & Desa</h3>
    </div>
    <span className="text-xs font-bold text-neutral-600">Tersinkronisasi API Sidami</span>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Dropdown Kecamatan */}
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-extrabold text-black">
        Kecamatan <span className="text-rose-600">*</span>
      </label>
      <select
        className="cursor-pointer w-full px-3 py-2.5 bg-white text-black text-sm font-bold border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] focus:outline-none focus:ring-2 focus:ring-[#059669]"
      >
        <option value="">-- Pilih Kecamatan --</option>
        <option value="330315">PADAMARA (330315)</option>
        <option value="330305">PURBALINGGA (330305)</option>
        <option value="330309">BOBOTSARI (330309)</option>
        {/* 18 Kecamatan Purbalingga */}
      </select>
    </div>

    {/* Dropdown Desa / Kelurahan */}
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-extrabold text-black">
        Desa / Kelurahan <span className="text-rose-600">*</span>
      </label>
      <select
        className="cursor-pointer w-full px-3 py-2.5 bg-white text-black text-sm font-bold border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-neutral-200 disabled:cursor-not-allowed"
      >
        <option value="">-- Pilih Kecamatan Terlebih Dahulu --</option>
        <option value="3303152001">KARANGPULE</option>
        <option value="3303152002">SOKAWERA</option>
        <option value="3303151004">KARANGSENTUL</option>
        {/* Desa otomatis termuat berdasarkan kode_kec */}
      </select>
    </div>
  </div>
</div>
```

---

### 4.4. Komponen Unggah Berkas (File Upload Box)

```tsx
<div className="flex flex-col gap-2">
  <label className="text-sm font-extrabold text-black flex items-center justify-between">
    <span>Upload Berkas Pendukung (KTP/Dokumen) <span className="text-rose-600">*</span></span>
    <span className="text-xs font-semibold text-neutral-500">Maks. 5 MB (PDF/JPG/PNG)</span>
  </label>
  <div className="cursor-pointer relative p-6 bg-white border-2 border-dashed border-black rounded-lg shadow-[3px_3px_0px_#121212] hover:bg-neutral-50 transition-all flex flex-col items-center justify-center text-center gap-2">
    <div className="w-12 h-12 bg-[#FFE600] border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_#121212]">
      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-extrabold text-black">Tarik berkas ke sini atau <span className="underline decoration-2">pilih dari perangkat</span></p>
      <p className="text-xs font-medium text-neutral-500 mt-1">Sistem otomatis memverifikasi keamanan berkas.</p>
    </div>
    <input type="file" className="cursor-pointer absolute inset-0 opacity-0 w-full h-full" />
  </div>
</div>
```

---

## 5. Tata Letak Responsif (Responsive Layout Guidelines)

### 5.1. Tampilan Mobile (< 768px)
- Seluruh kolom input bertumpuk rapi dalam 1 kolom vertikal (`grid-cols-1`).
- Tombol navigasi langkah dan tombol "Kirim" disematkan dalam bar bawah melayang (*sticky bottom bar*) dengan padding yang nyaman disentuh jempol (*touch target min 48px*).
- Pada builder form admin di layar ponsel: mode editor dan preview dipisahkan dengan switcher tab di header.

### 5.2. Tampilan Tablet (768px - 1024px)
- Form input terbagi menjadi 2 kolom untuk field yang saling berkaitan (misal: Tanggal Lahir & Tempat Lahir, atau Kecamatan & Desa).
- Sidebar navigasi admin menggunakan drawer geser neobrutalism.

### 5.3. Tampilan Desktop (> 1024px)
- **Halaman Form Publik:** Kontainer form berada di tengah (*centered*) dengan lebar maksimal `max-w-3xl`, dihiasi banner header kustom OPD dan kartu bayangan solid 6px.
- **Form Builder Admin:** Layout 3-kolom:
  - Kolom Kiri (260px): Toolbox daftar komponen (Text, Select, Wilayah Purbalingga, File, Rating).
  - Kolom Tengah (Fleksibel): Canvas perakitan form dengan live drag-reorder.
  - Kolom Kanan (320px): Panel konfigurasi atribut & validasi field yang sedang aktif dipilih.

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'E-Form Kabupaten Purbalingga | Formulir Digital Terpadu',
  description: 'Portal layanan formulir digital dinamis resmi Pemerintah Kabupaten Purbalingga berbasis Neobrutalism.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FFFDF5] text-[#0F172A] antialiased selection:bg-[#FFE600] selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}


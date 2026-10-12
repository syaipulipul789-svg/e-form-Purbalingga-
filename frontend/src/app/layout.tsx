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
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}

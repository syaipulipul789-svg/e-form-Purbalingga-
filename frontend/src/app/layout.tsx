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
      <body className="min-h-screen bg-[#FFFDF8] text-[#121212] antialiased selection:bg-[#FFE600] selection:text-black">
        {children}
      </body>
    </html>
  );
}

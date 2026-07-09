import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrowEasy AI CSV Importer | Intelligent Lead Data Mapping',
  description: 'Intelligently parse, map, and import CRM lead information from any arbitrary CSV format using LLM AI mapping.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

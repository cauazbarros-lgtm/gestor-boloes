import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BolãoPro — Bolões do Brasileirão',
  description: 'Sistema profissional de bolões do Campeonato Brasileiro. Faça seu palpite e concorra ao prêmio acumulado.',
  openGraph: {
    title: 'BolãoPro — Bolões do Brasileirão',
    description: 'Participe do bolão e concorra ao prêmio acumulado!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

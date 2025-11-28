import "./globals.css";

// Root layout without locale - just render children
// The actual layout logic is in [locale]/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

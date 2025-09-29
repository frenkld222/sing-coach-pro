import "./globals.css";

export const metadata = {
  title: "Sing Coach Pro — Pitch & Beat Trainer",
  description: "Browser-based singing coach: live pitch scale, cents accuracy, on-beat detection, scale & song practice.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

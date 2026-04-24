import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>

        {/* 🔥 FORCE GOOGLE ANALYTICS */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-7CME11RYDP"></script>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-7CME11RYDP');
            `,
          }}
        />

        {children}

      </body>
    </html>
  );
}
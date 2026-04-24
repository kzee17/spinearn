import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "SpinEarn – Fintech Engagement & Earning Platform",
  description:
    "SpinEarn is a fintech-powered engagement platform enabling users to earn through digital tasks, referrals, and verified social interactions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7CME11RYDP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7CME11RYDP');
          `}
        </Script>
      </head>

      <body>{children}</body>
    </html>
  );
}
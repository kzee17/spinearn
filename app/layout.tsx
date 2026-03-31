import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "SpinEarn – Fintech Engagement & Earning Platform",

  description:
    "SpinEarn is a fintech-powered engagement platform enabling users to earn through digital tasks, referrals, and verified social interactions.",

  keywords: [
    "SpinEarn",
    "Spinbyte",
    "earn money online Nigeria",
    "fintech platform Nigeria",
    "digital earning platform",
    "social engagement earning",
    "online income platform",
  ],

  authors: [{ name: "Spinbyte International Ltd" }],

  openGraph: {
    title: "SpinEarn – Fintech Engagement Platform",
    description:
      "Earn through digital tasks, referrals, and verified social engagement with SpinEarn.",
    url: "https://spinbyte.app",
    siteName: "SpinEarn",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SpinEarn – Earn Through Digital Engagement",
    description:
      "A fintech-powered platform where users earn from tasks, referrals, and social interactions.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>

        {children}

        {/* 🔥 Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;

            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>

      </body>
    </html>
  );
}
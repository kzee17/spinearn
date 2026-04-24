import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpinEarn – Fintech Engagement & Earning Platform",
  description:
    "SpinEarn is a fintech-powered engagement platform enabling users to earn through digital tasks, referrals, and verified social interactions.",
  authors: [{ name: "Spinbyte International Ltd" }],
  keywords: [
    "SpinEarn",
    "Spinbyte",
    "earn money online Nigeria",
    "fintech platform Nigeria",
    "digital earning platform",
    "social engagement earning",
    "online income platform",
  ],
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
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-7CME11RYDP"
        />
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
      </head>
      <body>{children}</body>
    </html>
  );
}
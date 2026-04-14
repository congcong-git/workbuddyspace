import type { Metadata } from "next";
import { Lora, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollTop from "@/components/ui/ScrollTop";
import "@/styles/globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "聪聪的小站",
    template: "%s | 聪聪的小站",
  },
  description: "一个温暖文艺的个人博客，记录生活、技术与思考",
  keywords: ["博客", "技术", "生活", "摄影", "聪聪"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${lora.variable} ${notoSansSC.variable} ${notoSerifSC.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-warm-50 dark:bg-bark-900 text-bark-700 dark:text-bark-100 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ScrollTop />
        </ThemeProvider>
      </body>
    </html>
  );
}

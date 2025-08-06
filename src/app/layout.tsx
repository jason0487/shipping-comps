import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shipping Comps - E-commerce Competitor Shipping Analysis",
  description: "Get real-time shipping strategies from your competitors with AI-powered analysis",
  keywords: "shipping analysis, competitor analysis, e-commerce, logistics, pricing strategy",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎯</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-white relative">
          {/* Background image overlay */}
          <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30 -z-10"
            style={{
              backgroundImage: "url('/images/backround-image-radial.png')",
              backgroundSize: '150% 100%'
            }}
          />
          
          <ErrorBoundary>
            <AuthProvider>
              <div className="relative z-10 flex flex-col min-h-screen">
                <Header />
                <div className="flex-1">
                  {children}
                </div>
                <Footer />
              </div>
            </AuthProvider>
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
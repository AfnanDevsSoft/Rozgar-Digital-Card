import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
    title: 'Lab Portal | Digital Health Card System',
    description: 'Laboratory portal for managing tests, billing, and reports',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    {children}
                    <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#0a0a0a', color: '#fff' } }} />
                </Providers>
            </body>
        </html>
    );
}

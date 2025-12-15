import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
    title: 'My Health Card | Digital Health Card System',
    description: 'View your health card, reports, and transaction history',
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

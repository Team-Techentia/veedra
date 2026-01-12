'use client';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#1F3047',
          color: '#000',
          border: '1px solid #D4A373',
          fontFamily: 'var(--font-geist-sans)',
          padding: '12px 16px',
          fontSize: '14px',
        },

        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#ecfdf5',
          },
          style: {
            border: '1px solid #22c55e',
            background: '#FEFAE0',
            color: '#000',
          },
        },

        error: {
          iconTheme: {
            primary: '#ff3131',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #1F3047',
            background: '#fff',
            color: '#1F3047',
            fontWeight: 'bold',
          },
        },

        loading: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#ecfdf5',
          },
          style: {
            border: '1px solid #22c55e',
            background: '#FEFAE0',
            color: '#000',
            fontWeight: '500',
          },
        },
      }}
    />
  );
}

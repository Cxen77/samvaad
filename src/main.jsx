import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60000, // 1 minute
            refetchOnWindowFocus: false, // Prevent aggressive refetching
        },
    },
});

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { FeatureProvider } from './context/FeatureContext';
import { ThemeProvider } from './context/ThemeContext';
import { SamvaadProvider } from './context/SamvaadContext';
import { DirectCallProvider } from './context/DirectCallContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <FeatureProvider>
                        <SocketProvider>
                            <DirectCallProvider>
                                <SamvaadProvider>
                                    <App />
                                </SamvaadProvider>
                            </DirectCallProvider>
                        </SocketProvider>
                    </FeatureProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </QueryClientProvider>
);

import { lazy, Suspense } from 'react';
import {
  RouterProvider,
  createHashRouter,
  createMemoryRouter,
} from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import './lib/i18n';
import { AppShell } from './components/layout/AppShell';
import { GradientLine } from './components/layout/GradientLine';
import { GridBackground } from './components/layout/GridBackground';
import { Toaster } from 'sonner';
import { ThemeEffect } from './components/layout/ThemeEffect';

const P01Page = lazy(() => import('@/pages/P01'));
const P02Page = lazy(() => import('@/pages/P02'));
const P03Page = lazy(() => import('@/pages/P03'));
const P04Page = lazy(() => import('@/pages/P04'));
const P05Page = lazy(() => import('@/pages/P05'));
const P06Page = lazy(() => import('@/pages/P06'));
const P07Page = lazy(() => import('@/pages/P07'));
const P08Page = lazy(() => import('@/pages/P08'));
const P09Page = lazy(() => import('@/pages/P09'));
const P10Page = lazy(() => import('@/pages/P10'));

const HashRouter =
  typeof window !== 'undefined' ? createHashRouter : createMemoryRouter;

function PageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="font-mono text-sm text-fg-muted">Loading…</div>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

const router = HashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Page><P03Page /></Page> },
      { path: 'onboarding/detect', element: <Page><P01Page /></Page> },
      { path: 'onboarding/language', element: <Page><P02Page /></Page> },
      { path: 'apps', element: <Page><P04Page /></Page> },
      { path: 'browse', element: <Page><P05Page /></Page> },
      { path: 'buckets', element: <Page><P06Page /></Page> },
      { path: 'settings', element: <Page><P09Page /></Page> },
      { path: 'package/:id', element: <Page><P07Page /></Page> },
      { path: 'job/:id', element: <Page><P08Page /></Page> },
      { path: 'error', element: <Page><P10Page /></Page> },
      { path: '*', element: <Page><P03Page /></Page> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeEffect />
      <GradientLine />
      <GridBackground />
      <div className="relative z-10 flex h-full w-full flex-col">
        <RouterProvider router={router} />
      </div>
      <Toaster richColors position="top-right" theme="dark" />
    </QueryClientProvider>
  );
}
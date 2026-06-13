'use client';

import { Providers } from './providers';
import AppShell from '@/components/AppShell';

export default function ClientApp() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  );
}

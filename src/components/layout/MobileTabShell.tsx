import React from 'react';

import AppShell from './AppShell';
import { BottomNavItem } from './BottomNav';

export default function MobileTabShell({
  title,
  subtitle,
  children,
  items,
  activeKey,
  headerRight,
}: {
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
  items: BottomNavItem[];
  activeKey?: string | null;
  headerRight?: React.ReactNode;
}) {
  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      headerRight={headerRight}
      bottomNavItems={items}
      activeBottomNavKey={activeKey}
    >
      {children}
    </AppShell>
  );
}

// app/dashboard/page.tsx
'use client'; // Required for client-side interactions

import { useState } from 'react';
import styles from './css/Dashboard.module.scss';

// Import your components (create these files in components/dashboard)
import Home from './components/dashboard/Home';
import Tasks from './components/dashboard/Tasks';
import Journal from './components/dashboard/Journal';
import Budget from './components/dashboard/Budget';
import Events from './components/dashboard/Events';
import Goals from './components/dashboard/Goals';

const MENU_ITEMS = ['Home', 'Tasks', 'Journal', 'Budget', 'Events', 'Goals'] as const;
type MenuItem = typeof MENU_ITEMS[number];

const COMPONENT_MAP: Record<MenuItem, React.ReactNode> = {
  Home: <Home />,
  Tasks: <Tasks />,
  Journal: <Journal />,
  Budget: <Budget />,
  Events: <Events />,
  Goals: <Goals />,
};

export default function Dashboard() {
  const [currentDisplay, setCurrentDisplay] = useState<MenuItem>('Home');

  return (
    <div className={styles.dashboard}>
      <div className={styles.menu}>
        <h1>Adam&apos;s Dashboard</h1>
        {MENU_ITEMS.map((item) => (
          <button 
            key={item}
            onClick={() => setCurrentDisplay(item)}
            className={currentDisplay === item ? styles.active : ''}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>{currentDisplay}</h1>
        {COMPONENT_MAP[currentDisplay]}
      </div>
    </div>
  );
}
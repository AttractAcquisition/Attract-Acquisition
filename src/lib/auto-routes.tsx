import React from 'react';

// Scan the pages directory for all .tsx files
const pages = import.meta.glob('../pages/**/*.tsx');

export const autoRoutes = Object.keys(pages).map((path) => {
  // Extract the name (e.g., ../pages/SPOA.tsx -> /spoa)
  const name = path
    .replace('../pages/', '')
    .replace('.tsx', '')
    .replace(/\/index$/, '')
    .toLowerCase();

  const routePath = name === 'home' ? '/' : `/${name}`;
  const Component = React.lazy(pages[path] as any);

  return {
    path: routePath,
    element: (
      <React.Suspense fallback={<div className="loading-shimmer" />}>
        <Component />
      </React.Suspense>
    ),
  };
});

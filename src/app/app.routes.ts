import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'browse',
    loadComponent: () => import('./pages/browse/browse').then((m) => m.BrowseComponent),
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/doc/doc').then((m) => m.DocComponent),
  },
  {
    path: 'docs/:p1',
    loadComponent: () => import('./pages/doc/doc').then((m) => m.DocComponent),
  },
  {
    path: 'docs/:p1/:p2',
    loadComponent: () => import('./pages/doc/doc').then((m) => m.DocComponent),
  },
  {
    path: 'docs/:p1/:p2/:p3',
    loadComponent: () => import('./pages/doc/doc').then((m) => m.DocComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

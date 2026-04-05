export interface NavItem {
  labelKey: string;
  link: string;
}

export const navItems: NavItem[] = [
  { labelKey: 'nav.home', link: '/' },
  { labelKey: 'nav.docs', link: '/browse' },
];

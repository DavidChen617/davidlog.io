export interface SocialLink {
  label: string;
  href: string;
}

export const socialLinks = {
  github: {
    label: 'GitHub',
    href: 'https://github.com/DavidChen617',
  },
  linkedin: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/david-chen-687149333',
  },
  x: {
    label: 'X',
    href: 'https://x.com/ChenDavid617',
  },
} as const satisfies Record<string, SocialLink>;

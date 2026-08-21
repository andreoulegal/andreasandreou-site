import { getSupabasePublicClient } from './supabase/public';

export type SiteContentMap = Record<string, unknown>;

export type NavigationItem = {
  label: string;
  href: string;
  display_order: number;
  visible: boolean;
};

export const defaultNavigation: NavigationItem[] = [
  { label: 'Bio', href: '/bio', display_order: 1, visible: true },
  { label: 'Expertise', href: '/work', display_order: 2, visible: true },
  { label: 'Public Contribution', href: '/public-contribution', display_order: 3, visible: true },
  { label: 'Services', href: '/#services', display_order: 4, visible: true },
  { label: 'Procura', href: 'https://www.procura.gr/', display_order: 5, visible: true },
  { label: 'Notes', href: '/#notes', display_order: 6, visible: true }
];

const defaults: SiteContentMap = {
  'home.hero.headline': 'Helping businesses create value through regulation, technology and public institutions.',
  'home.hero.explore_label': 'Explore expertise',
  'home.hero.explore_href': '#expertise',
  'home.hero.conversation_label': 'Start a conversation',
  'home.hero.conversation_href': '#contact',
  'home.about.eyebrow': 'About',
  'home.about.intro': 'I am Andreas Andreou, an Athens-based commercial lawyer, Associate at Frangos Law and leading the operations at the firm’s Athens office.',
  'home.about.practice': 'My work sits at the intersection of cross-border commercial law, European regulation and public institutions, with a particular focus on Greece and Cyprus.',
  'home.about.public_role': 'I was honoured to be elected as a Municipal Councillor for the Municipality of Galatsi and served as Deputy Mayor from 2024 to 2026. I am also active in the European Committee of the Regions’ networks as an EU Local Councillor, Young Elected Politician and member of the Regional Hubs Network.',
  'home.about.button_label': 'Read my full bio',
  'home.about.image_alt': 'Andreas Andreou at the European Parliament',
  'home.about.image_caption': 'Andreas Andreou · European institutions',
  'home.expertise.eyebrow': 'Expertise',
  'home.expertise.title': 'Turning regulation into strategic value',
  'home.expertise.category_line': ['Business Regulation', 'Legal', 'Digital Transformation', 'Public Institutions'],
  'home.expertise.cards': [
    { number: '01', title: 'Business Regulation', body: 'Turning regulatory requirements into informed business decisions and strategic advantage.' },
    { number: '02', title: 'Legal', body: 'Practical legal guidance for complex, regulated and cross-border matters.' },
    { number: '03', title: 'Digital Transformation', body: 'Connecting technology with the institutional realities that determine whether change works.' },
    { number: '04', title: 'Public Institutions', body: 'Understanding how public bodies operate — and how businesses can work with them effectively.' }
  ],
  'home.procura.eyebrow': 'Procura',
  'home.procura.title': 'The platform for better public procurement',
  'home.procura.body': 'Procura is an early-stage attempt to improve how public institutions conduct market research before procurement.',
  'home.procura.action_label': 'Explore Procura',
  'home.public_contribution.eyebrow': 'Public Contribution',
  'home.public_contribution.title': 'Institutions that work better for the people they serve.',
  'home.public_contribution.body': "From Galatsi to European networks, my public work focuses on practical improvements that make institutions more responsive, accessible and useful in people's everyday lives.",
  'home.services.eyebrow': 'Ways to work together',
  'home.services.items': ['Legal and regulatory problem-solving', 'Greek and Cypriot market entry', 'Public procurement and B2G strategy', 'Cross-border coordination', 'Institutional and stakeholder strategy'],
  'home.notes.eyebrow': 'Notes',
  'home.notes.title': 'Recent thinking and updates',
  'home.notes.view_all_label': 'View all notes',
  'home.closing.eyebrow': 'Start a conversation',
  'home.closing.title': 'Good judgment should lead to a practical next step.',
  'home.closing.button_label': 'Get in touch',
  'seo.home.title': 'Andreas Andreou | Law, Regulation & Public Institutions',
  'seo.home.description': 'Helping businesses create value through regulation, technology and public institutions.'
};

function unwrap(value: unknown): unknown {
  if (value && typeof value === 'object' && 'value' in value) return (value as { value: unknown }).value;
  return value;
}

export async function getPublishedSiteContent(): Promise<SiteContentMap> {
  const content: SiteContentMap = { ...defaults };
  if (!import.meta.env.PUBLIC_SUPABASE_ANON_KEY) return content;

  try {
    const { data, error } = await getSupabasePublicClient()
      .from('site_content')
      .select('content_key,value')
      .eq('status', 'published');
    if (error) return content;
    for (const row of data ?? []) content[row.content_key] = unwrap(row.value);
  } catch {
    return content;
  }
  return content;
}

export async function getPublishedNavigation(): Promise<NavigationItem[]> {
  if (!import.meta.env.PUBLIC_SUPABASE_ANON_KEY) return defaultNavigation;

  try {
    const { data, error } = await getSupabasePublicClient()
      .from('navigation_items')
      .select('label,href,display_order,visible')
      .eq('status', 'published')
      .eq('visible', true)
      .order('display_order', { ascending: true });
    if (error || !data?.length) return defaultNavigation;
    return data as NavigationItem[];
  } catch {
    return defaultNavigation;
  }
}

export function contentText(content: SiteContentMap, key: string): string {
  const value = content[key];
  return typeof value === 'string' ? value : String(value ?? '');
}

export function contentArray<T>(content: SiteContentMap, key: string, fallback: T[] = []): T[] {
  const value = content[key];
  return Array.isArray(value) ? (value as T[]) : fallback;
}

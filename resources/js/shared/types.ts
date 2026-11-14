/** Shapes of the props Laravel sends (see App\Services\PortfolioQuery). */

export type Option<T extends string = string> = { value: T; label: string };

export type StatusValue = 'live' | 'built' | 'in_development' | 'research';

export type TechRef = { slug: string; name: string };

export type Link = { label: string; href: string };

export type SiteShared = {
    name: string;
    title: string;
    role_line: string;
    location: string;
    socials: { label: string; url: string; icon: string }[];
    availability: { enabled: boolean; text: string };
    has_cv: boolean;
    /** Portrait (640×800) and square avatar (192×192) URLs, uploaded in the admin. */
    photo: { portrait: string; avatar: string } | null;
    contact: { email: string | null; phone: string | null; whatsapp: string | null };
};

export type ThemeOption = { key: string; label: string; scheme: 'light' | 'dark'; bg: string };

/** App\Support\Themes::config(): the themes offered and the default ('system' = follow the device). */
export type Appearance = { default: string; picker: boolean; themes: ThemeOption[] };

/** App\Support\SiteLabels: interface texts, edited in the admin under Labels. */
export type Labels = {
    common: Record<'theme' | 'theme_system' | 'download_cv' | 'skip' | 'open_menu' | 'close_menu' | 'home' | 'projects', string>;
    home: Record<
        | 'about_eyebrow'
        | 'education'
        | 'map_title'
        | 'all_projects'
        | 'more_work'
        | 'case_studies'
        | 'stat_years'
        | 'stat_projects'
        | 'stat_live'
        | 'stat_technologies'
        | 'skill_hint'
        | 'skill_used'
        | 'skill_none'
        | 'skill_unlinked'
        | 'skill_all'
        | 'skill_close'
        | 'sections',
        string
    >;
    palette: Record<
        'open' | 'placeholder' | 'sections' | 'projects' | 'actions' | 'all_projects' | 'download_cv' | 'copy_email' | 'copied' | 'empty' | 'hint',
        string
    >;
    contact: Record<
        'email' | 'phone' | 'whatsapp' | 'location' | 'name' | 'form_email' | 'subject' | 'message' | 'required' | 'send' | 'sending' | 'send_another' | 'verify',
        string
    >;
    projects: Record<
        'search' | 'search_placeholder' | 'category' | 'status' | 'technology' | 'show_all' | 'show_fewer' | 'clear' | 'empty' | 'count_one' | 'count_many',
        string
    >;
    project: Record<
        | 'role'
        | 'client'
        | 'company'
        | 'period'
        | 'problem'
        | 'contribution'
        | 'architecture'
        | 'features'
        | 'challenges'
        | 'screens'
        | 'metrics'
        | 'technologies'
        | 'links'
        | 'previous'
        | 'next',
        string
    >;
    footer: Record<'navigate' | 'elsewhere' | 'all_projects', string>;
    diagram: Record<'device' | 'service' | 'queue' | 'storage' | 'user' | 'external' | 'async' | 'sync_legend' | 'async_legend' | 'hint' | 'zoom_in' | 'zoom_out' | 'zoom_reset' | 'fullscreen' | 'exit_fullscreen', string>;
};

export type SharedProps = {
    site: SiteShared;
    appearance: Appearance;
    labels: Labels;
    nav: Link[];
    footer: { tagline?: string; copyright?: string };
    flash: { success: string | null };
};

export type ProjectCard = {
    slug: string;
    title: string;
    summary: string;
    company: string | null;
    client: string | null;
    period: string | null;
    category: Option;
    status: Option<StatusValue>;
    status_note: string | null;
    is_featured: boolean;
    technologies: TechRef[];
    cover: { url: string; alt: string } | null;
};

export type DiagramNode = {
    id: string;
    label: string;
    sublabel?: string;
    type: 'device' | 'service' | 'queue' | 'storage' | 'user' | 'external';
    col: number;
    row: number;
};

export type DiagramEdge = { from: string; to: string; label?: string; mode?: 'sync' | 'async' };

export type Diagram = {
    slug: string;
    title: string;
    description: string | null;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
};

export type ProjectDetail = ProjectCard & {
    role: string | null;
    authorship_note: string | null;
    problem: string | null;
    contribution: string | null;
    features: string[];
    challenges: { challenge: string; solution: string }[];
    metrics: { label: string; value: string; source?: string }[];
    public_links: { label: string; url: string }[];
    diagrams: Diagram[];
    gallery: { url: string; alt: string }[];
};

export type SkillCategory = {
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    technologies: TechRef[];
};

export type Experience = {
    id: number;
    company: string;
    title: string;
    location: string | null;
    started_at: string;
    ended_at: string | null;
    summary: string | null;
    phases: { title: string; period?: string; points: string[] }[];
    technologies: TechRef[];
};

export type Education = {
    id: number;
    degree: string;
    institution: string;
    detail: string | null;
    started_year: number | null;
    ended_year: number | null;
};

export type Specialization = {
    slug: string;
    title: string;
    icon: string | null;
    summary: string;
    capabilities: { text: string; status: Option<StatusValue> }[];
    diagram: string | null;
    projects: { slug: string; title: string }[];
};

export type SectionCopy = { eyebrow?: string; heading: string; intro?: string | null };

export type HeroContent = {
    eyebrow?: string;
    headline: string;
    subheading: string;
    chips: string[];
    primary_cta: Link;
    secondary_cta: Link;
    tertiary_cta: Link;
    flows: { label: string; project: string; steps: string[] }[];
};

export type AboutContent = {
    heading: string;
    bio: string;
    highlights: { value: string; label: string }[];
};

export type HomeProps = {
    hero: HeroContent;
    about: AboutContent;
    sections: Record<'skills' | 'experience' | 'projects' | 'engineering' | 'architecture' | 'contact', SectionCopy>;
    skills: SkillCategory[];
    experiences: Experience[];
    education: Education[];
    featuredProjects: ProjectCard[];
    otherProjects: ProjectCard[];
    specializations: Specialization[];
    diagrams: Diagram[];
    stats: Stat[];
};

/** PortfolioQuery::stats(): numbers counted from the content. */
export type Stat = { key: 'years' | 'projects' | 'live' | 'technologies'; value: number; suffix: string };

/** GET /search.json, for the command palette. */
export type SearchProject = {
    slug: string;
    title: string;
    summary: string;
    category: string;
    status: { value: StatusValue; label: string };
    technologies: string[];
};

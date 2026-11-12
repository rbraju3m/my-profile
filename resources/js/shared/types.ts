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
    contact: { email: string | null; phone: string | null; whatsapp: string | null };
};

export type SharedProps = {
    site: SiteShared;
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
};

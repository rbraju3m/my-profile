import type { HomeProps } from '@/shared/types';

import { Layout } from '@/site/components/Layout';
import { About } from '@/site/components/sections/About';
import { Architecture } from '@/site/components/sections/Architecture';
import { Contact } from '@/site/components/sections/Contact';
import { Engineering } from '@/site/components/sections/Engineering';
import { ExperienceTimeline } from '@/site/components/sections/ExperienceTimeline';
import { FeaturedProjects } from '@/site/components/sections/FeaturedProjects';
import { Hero } from '@/site/components/sections/Hero';
import { Skills } from '@/site/components/sections/Skills';

export default function Home(props: HomeProps) {
    const { sections } = props;

    return (
        <Layout onHome>
            <Hero hero={props.hero} />
            <About about={props.about} education={props.education} />
            <Skills copy={sections.skills} skills={props.skills} />
            <ExperienceTimeline copy={sections.experience} experiences={props.experiences} />
            <FeaturedProjects copy={sections.projects} featured={props.featuredProjects} others={props.otherProjects} />
            <Engineering copy={sections.engineering} specializations={props.specializations} />
            <Architecture copy={sections.architecture} diagrams={props.diagrams} />
            <Contact copy={sections.contact} />
        </Layout>
    );
}

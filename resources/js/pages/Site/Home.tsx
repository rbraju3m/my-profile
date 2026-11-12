import type { HomeProps } from '@/shared/types';

import { Deferred } from '@/site/components/Deferred';
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
            {/* Above the fold: hydrated at once. The rest hydrates as it nears the viewport. */}
            <Hero hero={props.hero} />
            <Deferred>
                <About about={props.about} education={props.education} />
            </Deferred>
            <Deferred>
                <Skills copy={sections.skills} skills={props.skills} />
            </Deferred>
            <Deferred>
                <ExperienceTimeline copy={sections.experience} experiences={props.experiences} />
            </Deferred>
            <Deferred>
                <FeaturedProjects copy={sections.projects} featured={props.featuredProjects} others={props.otherProjects} />
            </Deferred>
            <Deferred>
                <Engineering copy={sections.engineering} specializations={props.specializations} />
            </Deferred>
            <Deferred>
                <Architecture copy={sections.architecture} diagrams={props.diagrams} />
            </Deferred>
            {/* Not deferred: text typed into a not-yet-hydrated form would be reset by hydration. */}
            <Contact copy={sections.contact} />
        </Layout>
    );
}

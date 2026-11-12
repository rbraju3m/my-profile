import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ActionIcon,
    AppShell,
    Badge,
    Burger,
    Group,
    Menu,
    NavLink,
    ScrollArea,
    Text,
    Tooltip,
    useComputedColorScheme,
    useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    Boxes,
    Briefcase,
    ExternalLink,
    FileImage,
    FolderKanban,
    GitFork,
    GraduationCap,
    Inbox,
    LayoutDashboard,
    LogOut,
    Moon,
    Settings,
    Shapes,
    Sun,
    User,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import type { AdminShared } from '../types';

const content = [
    { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { href: '/admin/experiences', label: 'Experience', icon: Briefcase },
    { href: '/admin/skills', label: 'Skills', icon: Shapes },
    { href: '/admin/specializations', label: 'Specialisations', icon: Boxes },
    { href: '/admin/diagrams', label: 'Diagrams', icon: GitFork },
    { href: '/admin/education', label: 'Education', icon: GraduationCap },
    { href: '/admin/media', label: 'Media library', icon: FileImage },
];

const settings = [
    { href: '/admin/settings/site', label: 'Profile & contact' },
    { href: '/admin/settings/hero', label: 'Hero' },
    { href: '/admin/settings/about', label: 'About' },
    { href: '/admin/settings/sections', label: 'Section headings' },
    { href: '/admin/settings/nav', label: 'Navigation' },
    { href: '/admin/settings/footer', label: 'Footer' },
    { href: '/admin/settings/seo', label: 'SEO & sharing' },
    { href: '/admin/settings/appearance', label: 'Appearance' },
    { href: '/admin/settings/labels', label: 'Labels' },
];

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
    const { auth, unreadMessages, flash } = usePage<AdminShared>().props;
    const url = usePage().url;
    const [opened, { toggle, close }] = useDisclosure();
    const { setColorScheme } = useMantineColorScheme();
    const scheme = useComputedColorScheme('light');

    // Flash messages from the server become toasts.
    useEffect(() => {
        if (flash.success) notifications.show({ color: 'teal', message: flash.success });
        if (flash.warning) notifications.show({ color: 'yellow', message: flash.warning, autoClose: 8000 });
    }, [flash.success, flash.warning]);

    useEffect(() => router.on('navigate', () => close()), [close]);

    const active = (href: string) => url === href || url.startsWith(`${href}/`) || url.startsWith(`${href}?`);

    return (
        <AppShell header={{ height: 56 }} navbar={{ width: 248, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="lg">
            <Head title={title} />
            <AppShell.Header px="md">
                <Group h="100%" justify="space-between">
                    <Group gap="sm">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
                        <Text fw={700} ff="monospace" c="signal">
                            RR
                        </Text>
                        <Text fw={600} visibleFrom="xs">
                            Portfolio admin
                        </Text>
                    </Group>
                    <Group gap="xs">
                        <Tooltip label="View site">
                            <ActionIcon component="a" href="/" target="_blank" variant="subtle" size="lg" aria-label="View site">
                                <ExternalLink size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={scheme === 'dark' ? 'Light mode' : 'Dark mode'}>
                            <ActionIcon
                                variant="subtle"
                                size="lg"
                                onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}
                                aria-label="Toggle colour scheme"
                            >
                                {scheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </ActionIcon>
                        </Tooltip>
                        <Menu position="bottom-end" width={220}>
                            <Menu.Target>
                                <ActionIcon variant="light" size="lg" radius="xl" aria-label="Account menu">
                                    <User size={18} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>{auth?.email}</Menu.Label>
                                <Menu.Item component={Link} href="/admin/account" leftSection={<User size={14} />}>
                                    Account & security
                                </Menu.Item>
                                <Menu.Item leftSection={<LogOut size={14} />} onClick={() => router.post('/admin/logout')}>
                                    Log out
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="xs">
                <AppShell.Section grow component={ScrollArea}>
                    <NavLink component={Link} href="/admin" label="Dashboard" leftSection={<LayoutDashboard size={16} />} active={url === '/admin'} />
                    <NavLink
                        component={Link}
                        href="/admin/messages"
                        label="Messages"
                        leftSection={<Inbox size={16} />}
                        active={active('/admin/messages')}
                        rightSection={unreadMessages > 0 ? <Badge size="sm" circle>{unreadMessages}</Badge> : null}
                    />
                    <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm" mt="md" mb={4}>
                        Content
                    </Text>
                    {content.map((item) => (
                        <NavLink key={item.href} component={Link} href={item.href} label={item.label} leftSection={<item.icon size={16} />} active={active(item.href)} />
                    ))}
                    <NavLink label="Site settings" leftSection={<Settings size={16} />} defaultOpened={url.startsWith('/admin/settings')} mt="md">
                        {settings.map((item) => (
                            <NavLink key={item.href} component={Link} href={item.href} label={item.label} active={active(item.href)} />
                        ))}
                    </NavLink>
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>{children}</div>
            </AppShell.Main>
        </AppShell>
    );
}

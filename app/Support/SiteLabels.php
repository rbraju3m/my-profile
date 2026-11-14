<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The small interface texts of the public site (form labels, button texts,
 * headings of fixed blocks), editable in the admin under "Labels".
 *
 * Saved values (the `labels` settings group) override the defaults below; an
 * empty field falls back to its default, so a label never renders blank and
 * labels added in a later release work without a data migration.
 */
final class SiteLabels
{
    /** group => [title, [key => [field name in the admin, default text]]] */
    public const GROUPS = [
        'common' => ['General', [
            'theme' => ['Theme picker button', 'Theme'],
            'theme_system' => ['Theme option that follows the device', 'System'],
            'download_cv' => ['Download CV (mobile menu)', 'Download CV'],
            'skip' => ['Skip link (keyboard users)', 'Skip to content'],
            'open_menu' => ['Open menu button (screen readers)', 'Open menu'],
            'close_menu' => ['Close menu button (screen readers)', 'Close menu'],
            'home' => ['Breadcrumb: home', 'Home'],
            'projects' => ['Breadcrumb: projects', 'Projects'],
        ]],
        'home' => ['Home page', [
            'about_eyebrow' => ['About: small label', 'About'],
            'education' => ['About: education heading', 'Education'],
            'map_title' => ['Hero: system map title bar', 'systems/in-production.map'],
            'all_projects' => ['Projects: link to all projects', 'All projects, with filters'],
            'more_work' => ['Projects: heading above the smaller cards', 'More work'],
            'case_studies' => ['Engineering: case studies label', 'Case studies'],
            'stat_years' => ['Hero numbers: years of experience', 'Years building software'],
            'stat_projects' => ['Hero numbers: projects', 'Projects on this site'],
            'stat_live' => ['Hero numbers: live projects', 'Live in production'],
            'stat_technologies' => ['Hero numbers: technologies', 'Technologies'],
            'skill_hint' => ['Skills: hint above the cards', 'Pick a technology to see where it was used'],
            'skill_used' => ['Skills: usage line (:projects, :roles = numbers)', 'Projects: :projects · Roles: :roles'],
            'skill_none' => ['Skills: no projects use it', 'Used in my roles, not in a project listed here yet'],
            'skill_unlinked' => ['Skills: neither a project nor a role lists it', 'Not linked to a project or role on this site yet'],
            'skill_all' => ['Skills: link to the filtered projects page (:count = number)', 'See all :count on the projects page'],
            'skill_close' => ['Skills: close the panel (screen readers)', 'Close'],
            'sections' => ['Section rail label (screen readers)', 'Sections'],
        ]],
        'palette' => ['Command palette (⌘K)', [
            'open' => ['Search button in the menu bar', 'Search'],
            'placeholder' => ['Search field', 'Search projects, sections, actions…'],
            'sections' => ['Group: sections', 'Sections'],
            'projects' => ['Group: projects', 'Projects'],
            'actions' => ['Group: actions', 'Actions'],
            'all_projects' => ['Action: all projects', 'Browse all projects'],
            'download_cv' => ['Action: download CV', 'Download CV'],
            'copy_email' => ['Action: copy email', 'Copy email address'],
            'copied' => ['Confirmation after copying', 'Copied'],
            'empty' => ['No results', 'Nothing matches that.'],
            'hint' => ['Keyboard hint at the bottom', '↑↓ to move · Enter to open · Esc to close'],
        ]],
        'contact' => ['Contact', [
            'email' => ['Details: email', 'Email'],
            'phone' => ['Details: phone', 'Phone'],
            'whatsapp' => ['Details: WhatsApp', 'WhatsApp'],
            'location' => ['Details: location', 'Location'],
            'name' => ['Form: name', 'Name'],
            'form_email' => ['Form: email', 'Email'],
            'subject' => ['Form: subject', 'Subject'],
            'message' => ['Form: message', 'Message'],
            'required' => ['Form: required note', 'All fields are required.'],
            'send' => ['Form: send button', 'Send message'],
            'sending' => ['Form: send button while sending', 'Sending…'],
            'send_another' => ['After sending: send another', 'Send another message'],
            'verify' => ['Spam check not completed', 'Please complete the check above the Send button.'],
        ]],
        'projects' => ['Projects page', [
            'search' => ['Search label', 'Search projects'],
            'search_placeholder' => ['Search placeholder', 'Search by name, client or technology…'],
            'category' => ['Filter: category', 'Category'],
            'status' => ['Filter: status', 'Status'],
            'technology' => ['Filter: technology', 'Technology'],
            'show_all' => ['Show all technologies (:count = number)', 'Show all :count'],
            'show_fewer' => ['Show fewer technologies', 'Show fewer'],
            'clear' => ['Clear filters', 'Clear filters'],
            'empty' => ['No results', 'No projects match these filters.'],
            'count_one' => ['Result count, one (:count = number)', ':count project'],
            'count_many' => ['Result count, several (:count = number)', ':count projects'],
        ]],
        'project' => ['Case study page', [
            'role' => ['Facts: role', 'Role'],
            'client' => ['Facts: client', 'Client'],
            'company' => ['Facts: company', 'Company'],
            'period' => ['Facts: period', 'Period'],
            'problem' => ['Heading: the problem', 'The problem'],
            'contribution' => ['Heading: what I did', 'What I did'],
            'architecture' => ['Heading prefix for diagrams', 'Architecture'],
            'features' => ['Heading: key features', 'Key features'],
            'challenges' => ['Heading: challenges', 'Challenges and solutions'],
            'screens' => ['Heading: screenshots', 'Screens'],
            'metrics' => ['Sidebar: numbers', 'Verified numbers'],
            'technologies' => ['Sidebar: technologies', 'Technologies'],
            'links' => ['Sidebar: links', 'Links'],
            'previous' => ['Previous project', 'Previous'],
            'next' => ['Next project', 'Next'],
        ]],
        'footer' => ['Footer', [
            'navigate' => ['Menu heading', 'Navigate'],
            'elsewhere' => ['Social links heading', 'Elsewhere'],
            'all_projects' => ['Link to all projects', 'All projects'],
        ]],
        'diagram' => ['Architecture diagrams', [
            'device' => ['Node type: device', 'Device'],
            'service' => ['Node type: service', 'Service'],
            'queue' => ['Node type: queue', 'Queue'],
            'storage' => ['Node type: storage', 'Storage'],
            'user' => ['Node type: people', 'People'],
            'external' => ['Node type: external', 'External'],
            'async' => ['Asynchronous step note', '(asynchronous)'],
            'sync_legend' => ['Legend: solid line', 'Direct call'],
            'async_legend' => ['Legend: dashed line', 'Asynchronous'],
            'hint' => ['Hint below wide diagrams', 'Hover a component to trace its connections'],
            'zoom_in' => ['Zoom in button', 'Zoom in'],
            'zoom_out' => ['Zoom out button', 'Zoom out'],
            'zoom_reset' => ['Zoom percentage button (resets)', 'Reset zoom'],
            'fullscreen' => ['Full screen button', 'Full screen'],
            'exit_fullscreen' => ['Leave full screen button', 'Exit full screen'],
        ]],
    ];

    /**
     * Defaults merged with the saved values.
     *
     * @param  array<string, mixed>  $saved
     * @return array<string, array<string, string>>
     */
    public static function resolve(array $saved): array
    {
        $labels = [];
        foreach (self::GROUPS as $group => [, $fields]) {
            foreach ($fields as $key => [, $default]) {
                $value = $saved[$group][$key] ?? null;
                $labels[$group][$key] = is_string($value) && trim($value) !== '' ? $value : $default;
            }
        }

        return $labels;
    }

    /** @return array<string, list<string>> */
    public static function rules(): array
    {
        $rules = [];
        foreach (self::GROUPS as $group => [, $fields]) {
            $rules[$group] = ['nullable', 'array'];
            foreach (array_keys($fields) as $key) {
                $rules["{$group}.{$key}"] = ['nullable', 'string', 'max:200'];
            }
        }

        return $rules;
    }

    /**
     * For the admin form: groups with their fields and defaults.
     *
     * @return list<array{key: string, title: string, fields: list<array{key: string, label: string, default: string}>}>
     */
    public static function schema(): array
    {
        $schema = [];
        foreach (self::GROUPS as $group => [$title, $fields]) {
            $schema[] = [
                'key' => $group,
                'title' => $title,
                'fields' => array_map(fn (string $key, array $field): array => ['key' => $key, 'label' => $field[0], 'default' => $field[1]], array_keys($fields), $fields),
            ];
        }

        return $schema;
    }
}

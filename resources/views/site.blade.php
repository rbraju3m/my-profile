<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{--
        Title, description, canonical, social cards and JSON-LD are written here
        by the server, not by React, so crawlers get them even if the SSR process
        is down. Values come from App\Support\Seo, i.e. from the admin.
    --}}
    @isset($seo)
        <title data-inertia>{{ $seo['title'] }}</title>
        <meta name="description" content="{{ $seo['description'] }}" data-inertia="description">
        <link rel="canonical" href="{{ $seo['canonical'] }}">
        <meta property="og:type" content="{{ $seo['type'] }}">
        <meta property="og:title" content="{{ $seo['title'] }}">
        <meta property="og:description" content="{{ $seo['description'] }}">
        <meta property="og:url" content="{{ $seo['canonical'] }}">
        <meta property="og:site_name" content="{{ config('app.name') }}">
        <meta name="twitter:card" content="{{ $seo['image'] ? 'summary_large_image' : 'summary' }}">
        <meta name="twitter:title" content="{{ $seo['title'] }}">
        <meta name="twitter:description" content="{{ $seo['description'] }}">
        @if ($seo['image'])
            <meta property="og:image" content="{{ $seo['image'] }}">
            <meta name="twitter:image" content="{{ $seo['image'] }}">
        @endif
        @foreach ($seo['structuredData'] as $document)
            <script type="application/ld+json">{!! json_encode(array_filter($document, fn ($v) => $v !== null), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) !!}</script>
        @endforeach
    @endisset
    @isset($errorPage)
        <title data-inertia>{{ $errorPage['title'] }}</title>
        <meta name="description" content="{{ $errorPage['description'] }}" data-inertia="description">
        <meta name="robots" content="noindex">
    @endisset

    @php($themeConfig = app(\App\Support\Themes::class)->config())
    <meta name="theme-color" content="{{ collect($themeConfig['themes'])->firstWhere('key', $themeConfig['default'])['bg'] ?? '#0a0b0d' }}">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">

    {{--
        Runs before first paint so the wrong theme never flashes. The visitor's
        saved choice wins if it is still offered; otherwise the admin's default
        (Appearance settings). "system" follows the device's light/dark setting.
        Keep in sync with resources/js/site/lib/useTheme.ts.
    --}}
    <script nonce="{{ Vite::cspNonce() }}">
        document.documentElement.classList.add('js');
        (function (c) {
            var root = document.documentElement, byKey = {}, pick = null;
            c.themes.forEach(function (t) { byKey[t.key] = t; });
            try { pick = localStorage.getItem('theme'); } catch (e) {}
            if (pick !== 'system' && !byKey[pick]) pick = c.default;
            if (!byKey[pick]) {
                var scheme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                pick = (c.themes.filter(function (t) { return t.scheme === scheme; })[0] || c.themes[0]).key;
            }
            var theme = byKey[pick];
            root.dataset.theme = theme.key;
            root.classList.toggle('dark', theme.scheme === 'dark');
            root.style.colorScheme = theme.scheme;
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', theme.bg);
        })({{ Js::from($themeConfig) }});
    </script>

    @viteReactRefresh
    @vite(['resources/js/site/app.tsx'])
    @inertiaHead
</head>
<body>
@inertia
</body>
</html>

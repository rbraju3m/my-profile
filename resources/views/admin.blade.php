<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title data-inertia>Admin · {{ config('app.name') }}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">

    {{-- Mantine's colour scheme, applied before first paint. --}}
    <script nonce="{{ Vite::cspNonce() }}">
        try {
            var s = localStorage.getItem('mantine-color-scheme-value') || 'auto';
            var d = s === 'auto' ? matchMedia('(prefers-color-scheme: dark)').matches : s === 'dark';
            document.documentElement.setAttribute('data-mantine-color-scheme', d ? 'dark' : 'light');
        } catch (e) {}
    </script>

    @viteReactRefresh
    @vite(['resources/js/admin/app.tsx'])
    @inertiaHead
</head>
<body>
@inertia
</body>
</html>

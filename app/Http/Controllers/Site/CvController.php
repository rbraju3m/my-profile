<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Services\Settings;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Serves whichever CV was last uploaded in the admin, under a clean filename. */
final class CvController extends Controller
{
    public function __invoke(Settings $settings): StreamedResponse
    {
        $cv = $settings->cv();
        abort_if($cv === null, 404);

        $name = Str::slug((string) ($settings->get('site')['name'] ?? 'cv')).'-cv.pdf';

        return response()->streamDownload(
            function () use ($cv): void {
                $stream = $cv->stream();
                fpassthru($stream);
                fclose($stream);
            },
            $name,
            ['Content-Type' => 'application/pdf', 'Cache-Control' => 'public, max-age=3600'],
        );
    }
}

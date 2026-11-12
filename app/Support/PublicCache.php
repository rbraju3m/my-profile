<?php

declare(strict_types=1);

namespace App\Support;

use App\Services\Settings;
use Spatie\ResponseCache\Facades\ResponseCache;

/** Everything the public site caches, cleared together after any admin write. */
final class PublicCache
{
    public function __construct(private readonly Settings $settings) {}

    public function flush(): void
    {
        $this->settings->flush();
        ResponseCache::clear();
    }
}

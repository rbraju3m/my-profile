<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Tests never depend on a built Vite manifest or a running SSR server.
        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }
}

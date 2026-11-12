<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * How far a project has really got. Shown as a badge on every project, so
 * nothing investigated or merely built is presented as running in production.
 */
enum ProjectStatus: string
{
    case Live = 'live';
    case Built = 'built';
    case InDevelopment = 'in_development';
    case Research = 'research';

    public function label(): string
    {
        return match ($this) {
            self::Live => 'Live',
            self::Built => 'Built',
            self::InDevelopment => 'In development',
            self::Research => 'Research',
        };
    }
}

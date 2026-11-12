<?php

declare(strict_types=1);

namespace App\Enums;

enum ProjectCategory: string
{
    case Healthcare = 'healthcare';
    case Ocr = 'ocr';
    case MobilePlatform = 'mobile_platform';
    case Erp = 'erp';
    case Saas = 'saas';
    case Web = 'web';

    public function label(): string
    {
        return match ($this) {
            self::Healthcare => 'Healthcare',
            self::Ocr => 'OCR & Documents',
            self::MobilePlatform => 'Mobile Platform',
            self::Erp => 'ERP & Business',
            self::Saas => 'SaaS',
            self::Web => 'Web',
        };
    }
}

<?php

declare(strict_types=1);

namespace App\Support;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/**
 * Cleans rich text written in the admin before it is stored. The public site
 * renders this HTML directly, so only a small set of formatting tags survives.
 */
final class RichText
{
    private const UNWRAP = ['b', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'span', 'small', 'sub', 'sup', 'div', 'section', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'font'];

    public static function clean(?string $html): ?string
    {
        if ($html === null || trim(strip_tags($html)) === '') {
            return null;
        }

        $config = new HtmlSanitizerConfig;
        // Other formatting (TipTap's underline/strike shortcuts, pasted
        // headings or spans) loses its tag but keeps its text. Anything not
        // listed (script, style, iframe...) is dropped whole.
        foreach (self::UNWRAP as $element) {
            $config = $config->blockElement($element);
        }

        $config = $config
            ->allowElement('p')
            ->allowElement('br')
            ->allowElement('strong')
            ->allowElement('em')
            ->allowElement('code')
            ->allowElement('ul')
            ->allowElement('ol')
            ->allowElement('li')
            ->allowElement('a', ['href', 'title'])
            ->allowLinkSchemes(['https', 'http', 'mailto'])
            ->forceAttribute('a', 'rel', 'noopener noreferrer')
            ->withMaxInputLength(50_000);

        return (new HtmlSanitizer($config))->sanitize($html);
    }
}

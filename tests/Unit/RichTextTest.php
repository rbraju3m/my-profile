<?php

declare(strict_types=1);

use App\Support\RichText;

it('keeps allowed formatting and links', function () {
    expect(RichText::clean('<p>A <strong>b</strong> <em>c</em> <code>d</code> <a href="https://x.dev">e</a></p><ul><li>f</li></ul>'))
        ->toBe('<p>A <strong>b</strong> <em>c</em> <code>d</code> <a href="https://x.dev" rel="noopener noreferrer">e</a></p><ul><li>f</li></ul>');
});

it('unwraps other formatting but keeps the words', function () {
    expect(RichText::clean('<p><u>under</u> <s>struck</s> <b>bold</b> <span style="color:red">span</span></p><h2>Heading</h2>'))
        ->toBe('<p>under struck bold span</p>Heading');
});

it('drops scripts, styles, frames, event handlers and unsafe links', function () {
    $clean = RichText::clean('<p>ok<script>alert(1)</script><style>p{}</style><iframe src="https://x">f</iframe><img src=x onerror=alert(1)><a href="javascript:alert(1)" onclick="x">l</a></p>');

    expect($clean)->toBe('<p>ok<a rel="noopener noreferrer">l</a></p>');
});

it('returns null for empty input', function (?string $html) {
    expect(RichText::clean($html))->toBeNull();
})->with([null, '', '<p></p>', '<p>   </p>']);

it('is stable when cleaned twice', function () {
    $once = RichText::clean("<p>It's <strong>fine</strong> &amp; &lt;safe&gt;</p>");

    expect(RichText::clean($once))->toBe($once);
});

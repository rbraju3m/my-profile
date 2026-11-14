<?php

declare(strict_types=1);

use App\Http\Controllers\Site\ContactController;
use App\Http\Controllers\Site\CvController;
use App\Http\Controllers\Site\HomeController;
use App\Http\Controllers\Site\ProjectController;
use App\Http\Controllers\Site\SearchIndexController;
use App\Http\Controllers\Site\SeoFilesController;
use Illuminate\Support\Facades\Route;

// Public pages, served from the full-page cache (see PublicPageCacheProfile).
Route::middleware('page-cache')->group(function () {
    Route::get('/', HomeController::class)->name('home');
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::get('/sitemap.xml', [SeoFilesController::class, 'sitemap'])->name('sitemap');
    Route::get('/robots.txt', [SeoFilesController::class, 'robots'])->name('robots');
});

Route::get('/cv', CvController::class)->name('cv');
Route::get('/search.json', SearchIndexController::class)->name('search-index');
Route::post('/contact', ContactController::class)->middleware('throttle:contact')->name('contact');

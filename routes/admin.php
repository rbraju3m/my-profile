<?php

declare(strict_types=1);

use App\Admin\SettingsSchema;
use App\Http\Controllers\Admin\AccountController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DiagramController;
use App\Http\Controllers\Admin\EducationController;
use App\Http\Controllers\Admin\ExperienceController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\MessageController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\ProjectMediaController;
use App\Http\Controllers\Admin\ReorderController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SettingsFileController;
use App\Http\Controllers\Admin\SkillController;
use App\Http\Controllers\Admin\SpecializationController;
use App\Http\Middleware\FlushPublicCache;
use App\Http\Middleware\RequireTwoFactor;
use Illuminate\Support\Facades\Route;

/*
 * Admin panel. Login, logout, two-factor and password routes come from
 * Fortify (config/fortify.php, prefix "admin").
 */
Route::prefix('admin')->name('admin.')->middleware(['auth', FlushPublicCache::class])->group(function () {
    // Reachable before two-factor is set up, so it can be set up.
    Route::get('account', AccountController::class)->name('account');

    Route::middleware(RequireTwoFactor::class)->group(function () {
        Route::get('/', DashboardController::class)->name('dashboard');

        Route::get('settings/{group}', [SettingsController::class, 'edit'])->whereIn('group', SettingsSchema::GROUPS)->name('settings.edit');
        Route::put('settings/{group}', [SettingsController::class, 'update'])->whereIn('group', SettingsSchema::GROUPS)->name('settings.update');
        Route::post('files/{file}', [SettingsFileController::class, 'store'])->whereIn('file', ['cv', 'photo', 'og_image'])->name('files.store');
        Route::delete('files/{file}', [SettingsFileController::class, 'destroy'])->whereIn('file', ['cv', 'photo', 'og_image'])->name('files.destroy');

        Route::resource('projects', ProjectController::class)->except('show');
        Route::post('projects/{project}/media', [ProjectMediaController::class, 'store'])->name('projects.media.store');

        Route::resource('experiences', ExperienceController::class)->except('show');
        Route::resource('specializations', SpecializationController::class)->except('show');
        Route::resource('diagrams', DiagramController::class)->except('show');
        Route::resource('education', EducationController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::get('skills', [SkillController::class, 'index'])->name('skills.index');
        Route::post('skill-categories', [SkillController::class, 'storeCategory'])->name('skill-categories.store');
        Route::put('skill-categories/{category}', [SkillController::class, 'updateCategory'])->name('skill-categories.update');
        Route::delete('skill-categories/{category}', [SkillController::class, 'destroyCategory'])->name('skill-categories.destroy');
        Route::post('technologies', [SkillController::class, 'storeTechnology'])->name('technologies.store');
        Route::put('technologies/{technology}', [SkillController::class, 'updateTechnology'])->name('technologies.update');
        Route::delete('technologies/{technology}', [SkillController::class, 'destroyTechnology'])->name('technologies.destroy');

        Route::post('reorder/{type}', ReorderController::class)->name('reorder');

        Route::get('messages', [MessageController::class, 'index'])->name('messages.index');
        Route::get('messages/{message}', [MessageController::class, 'show'])->name('messages.show');
        Route::patch('messages/{message}', [MessageController::class, 'update'])->name('messages.update');
        Route::delete('messages/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');

        Route::get('media', [MediaController::class, 'index'])->name('media.index');
        Route::patch('media/{media}', [MediaController::class, 'update'])->name('media.update');
        Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('media.destroy');
    });
});

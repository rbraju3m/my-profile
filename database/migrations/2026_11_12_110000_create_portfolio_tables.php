<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every piece of portfolio content lives in these tables so it can be edited
 * from the admin panel; nothing on the public site is hard-coded.
 *
 * Structured lists (features, challenges, metrics, diagram nodes) are JSON
 * columns: they are always read and written as a whole with their parent row,
 * never queried on their own.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('group', 64)->unique();
            $table->json('value');
            $table->timestamps();
        });

        Schema::create('skill_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon', 64)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('technologies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('skill_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon', 64)->nullable();
            $table->boolean('show_in_skills')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('company')->nullable();
            $table->string('client')->nullable();
            $table->boolean('show_client')->default(true);
            $table->string('category', 32);
            $table->string('status', 32);
            $table->string('status_note')->nullable();
            $table->string('period')->nullable();
            $table->string('role')->nullable();
            $table->text('authorship_note')->nullable();
            $table->text('summary');
            $table->text('problem')->nullable();
            $table->longText('contribution')->nullable();
            $table->json('features')->nullable();
            $table->json('challenges')->nullable();
            $table->json('metrics')->nullable();
            $table->json('public_links')->nullable();
            $table->json('seo')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['published_at', 'is_featured', 'sort_order']);
        });

        Schema::create('project_technology', function (Blueprint $table) {
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technology_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->primary(['project_id', 'technology_id']);
        });

        Schema::create('diagrams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('nodes');
            $table->json('edges');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('diagram_project', function (Blueprint $table) {
            $table->foreignId('diagram_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->primary(['diagram_id', 'project_id']);
        });

        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->string('company');
            $table->string('title');
            $table->string('location')->nullable();
            $table->date('started_at');
            $table->date('ended_at')->nullable();
            $table->text('summary')->nullable();
            $table->json('phases')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('experience_technology', function (Blueprint $table) {
            $table->foreignId('experience_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technology_id')->constrained()->cascadeOnDelete();
            $table->primary(['experience_id', 'technology_id']);
        });

        Schema::create('specializations', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('icon', 64)->nullable();
            $table->text('summary');
            $table->json('capabilities');
            $table->foreignId('diagram_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('project_specialization', function (Blueprint $table) {
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialization_id')->constrained()->cascadeOnDelete();
            $table->primary(['project_id', 'specialization_id']);
        });

        Schema::create('education', function (Blueprint $table) {
            $table->id();
            $table->string('degree');
            $table->string('institution');
            $table->string('detail')->nullable();
            $table->unsignedSmallInteger('started_year')->nullable();
            $table->unsignedSmallInteger('ended_year')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach ([
            'education', 'project_specialization', 'specializations', 'experience_technology',
            'experiences', 'diagram_project', 'diagrams', 'project_technology', 'projects',
            'technologies', 'skill_categories', 'settings',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};

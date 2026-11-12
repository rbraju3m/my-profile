<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Diagram;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Project;
use App\Models\SkillCategory;
use App\Models\Specialization;
use App\Models\Technology;
use App\Services\Settings;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Loads the verified content from database/seeders/data/portfolio.php.
 *
 * Idempotent: rows are matched by slug (or natural key) and updated, so it can
 * be re-run safely. After launch the admin panel is the source of truth, so
 * this is for fresh installs and tests, not for routine updates.
 */
final class PortfolioSeeder extends Seeder
{
    public function run(Settings $settings): void
    {
        // It upserts, so re-running it would silently overwrite everything edited in the admin.
        // The override is a one-off shell variable (read with getenv, so it works with cached config):
        //   PORTFOLIO_SEED_OVERWRITE=1 php artisan db:seed --class=PortfolioSeeder --force
        if (app()->isProduction() && Project::query()->exists() && getenv('PORTFOLIO_SEED_OVERWRITE') !== '1') {
            throw new RuntimeException('The site already has content. Re-seeding would overwrite admin edits; run with PORTFOLIO_SEED_OVERWRITE=1 to do it anyway.');
        }

        /** @var array<string, mixed> $data */
        $data = require __DIR__.'/data/portfolio.php';

        DB::transaction(function () use ($data, $settings): void {
            foreach ($data['settings'] as $group => $value) {
                $settings->put($group, $value);
            }

            $categories = [];
            foreach ($data['skill_categories'] as $i => $category) {
                $categories[$category['slug']] = SkillCategory::query()->updateOrCreate(
                    ['slug' => $category['slug']],
                    [...$category, 'sort_order' => $i],
                );
            }

            $technologies = [];
            $order = 0;
            foreach ($data['technologies'] as $slug => [$name, $category]) {
                $technologies[$slug] = Technology::query()->updateOrCreate(['slug' => $slug], [
                    'name' => $name,
                    'skill_category_id' => $categories[$category]->id,
                    'show_in_skills' => true,
                    'sort_order' => $order++,
                ]);
            }

            $diagrams = [];
            foreach ($data['diagrams'] as $i => $diagram) {
                $diagrams[$diagram['slug']] = Diagram::query()->updateOrCreate(
                    ['slug' => $diagram['slug']],
                    [...$diagram, 'sort_order' => $i],
                );
            }

            $projects = [];
            foreach ($data['projects'] as $i => $row) {
                $techSlugs = $row['technologies'] ?? [];
                $diagramSlugs = $row['diagrams'] ?? [];
                unset($row['technologies'], $row['diagrams']);

                $project = Project::query()->updateOrCreate(['slug' => $row['slug']], [
                    'is_featured' => false,
                    ...$row,
                    'sort_order' => $i,
                    'published_at' => now(),
                ]);

                $techSync = [];
                foreach (array_values($techSlugs) as $pos => $slug) {
                    $techSync[$technologies[$slug]->id] = ['sort_order' => $pos];
                }
                $project->technologies()->sync($techSync);
                $project->diagrams()->sync(self::ids($diagramSlugs, $diagrams));

                $projects[$row['slug']] = $project;
            }

            foreach ($data['experiences'] as $i => $row) {
                $techSlugs = $row['technologies'];
                unset($row['technologies']);

                $experience = Experience::query()->updateOrCreate(
                    ['company' => $row['company'], 'started_at' => $row['started_at']],
                    [...$row, 'sort_order' => $i],
                );
                $experience->technologies()->sync(self::ids($techSlugs, $technologies));
            }

            foreach ($data['education'] as $i => $row) {
                Education::query()->updateOrCreate(
                    ['degree' => $row['degree'], 'institution' => $row['institution']],
                    [...$row, 'sort_order' => $i],
                );
            }

            foreach ($data['specializations'] as $i => $row) {
                $projectSlugs = $row['projects'];
                $diagramSlug = $row['diagram'];
                unset($row['projects'], $row['diagram']);

                $specialization = Specialization::query()->updateOrCreate(['slug' => $row['slug']], [
                    ...$row,
                    'diagram_id' => $diagrams[$diagramSlug]->id,
                    'sort_order' => $i,
                ]);
                $specialization->projects()->sync(self::ids($projectSlugs, $projects));
            }
        });
    }

    /**
     * @param  list<string>  $slugs
     * @param  array<string, Model>  $models
     * @return list<int>
     */
    private static function ids(array $slugs, array $models): array
    {
        return array_map(fn (string $slug): int => (int) $models[$slug]->getKey(), $slugs);
    }
}

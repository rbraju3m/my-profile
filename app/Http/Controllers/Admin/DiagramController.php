<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Diagram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Inertia\Inertia;
use Inertia\Response;

final class DiagramController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Diagrams/Index', [
            'diagrams' => Diagram::query()->orderBy('sort_order')->withCount('projects')->get()
                ->map(fn (Diagram $d): array => [...$d->only(['id', 'title', 'slug', 'description']), 'nodes' => count($d->nodes), 'projects' => $d->projects_count]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Diagrams/Form', ['diagram' => null, 'types' => Diagram::NODE_TYPES]);
    }

    public function store(Request $request): RedirectResponse
    {
        $diagram = new Diagram(['sort_order' => (int) Diagram::query()->max('sort_order') + 1]);
        $this->save($diagram, $request);

        return redirect()->route('admin.diagrams.edit', $diagram)->with('success', 'Created.');
    }

    public function edit(Diagram $diagram): Response
    {
        return Inertia::render('Admin/Diagrams/Form', [
            'diagram' => [
                ...$diagram->only(['id', 'title', 'slug', 'description']),
                'nodes' => array_map(fn (array $n): array => ['sublabel' => '', ...$n], $diagram->nodes),
                'edges' => array_map(fn (array $e): array => ['label' => '', 'mode' => 'sync', ...$e], $diagram->edges),
            ],
            'types' => Diagram::NODE_TYPES,
        ]);
    }

    public function update(Request $request, Diagram $diagram): RedirectResponse
    {
        $this->save($diagram, $request);

        return back()->with('success', 'Saved.');
    }

    public function destroy(Diagram $diagram): RedirectResponse
    {
        $diagram->delete();

        return redirect()->route('admin.diagrams.index')->with('success', 'Deleted.');
    }

    private function save(Diagram $diagram, Request $request): void
    {
        $validator = validator($request->all(), [
            'title' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('diagrams', 'slug')->ignore($diagram->id)],
            'description' => ['nullable', 'string', 'max:600'],
            'nodes' => ['required', 'array', 'min:1', 'max:20'],
            'nodes.*.id' => ['required', 'string', 'max:40', 'regex:/^[a-z0-9_-]+$/i', 'distinct'],
            'nodes.*.label' => ['required', 'string', 'max:40'],
            'nodes.*.sublabel' => ['nullable', 'string', 'max:60'],
            'nodes.*.type' => ['required', Rule::in(Diagram::NODE_TYPES)],
            'nodes.*.col' => ['required', 'integer', 'between:0,6'],
            'nodes.*.row' => ['required', 'integer', 'between:0,4'],
            'edges' => ['present', 'array', 'max:40'],
            'edges.*.from' => ['required', 'string'],
            'edges.*.to' => ['required', 'string'],
            'edges.*.label' => ['nullable', 'string', 'max:40'],
            'edges.*.mode' => ['required', Rule::in(['sync', 'async'])],
        ]);

        // Edges must point at nodes that exist, and two nodes may not share a cell.
        $validator->after(function (Validator $v) use ($request): void {
            /** @var list<array<string, mixed>> $nodes */
            $nodes = array_values(array_filter((array) $request->input('nodes', []), 'is_array'));
            $ids = array_column($nodes, 'id');
            foreach ((array) $request->input('edges', []) as $i => $edge) {
                if (($edge['from'] ?? null) === ($edge['to'] ?? null)) {
                    $v->errors()->add("edges.{$i}.to", 'An arrow must point at a different box.');
                }
                foreach (['from', 'to'] as $end) {
                    if (! in_array($edge[$end] ?? null, $ids, true)) {
                        $v->errors()->add("edges.{$i}.{$end}", 'Pick a box that exists in this diagram.');
                    }
                }
            }
            $cells = [];
            foreach ($nodes as $index => $node) {
                $cells[($node['col'] ?? '').':'.($node['row'] ?? '')][] = $index;
            }
            foreach ($cells as $indexes) {
                if (count($indexes) > 1) {
                    foreach ($indexes as $index) {
                        $v->errors()->add("nodes.{$index}.col", 'Two boxes are in the same column and row.');
                    }
                }
            }
        });

        $data = $validator->validate();

        $diagram->fill([
            ...$data,
            'nodes' => array_map(fn (array $n): array => array_filter([
                ...$n, 'col' => (int) $n['col'], 'row' => (int) $n['row'],
            ], fn ($v) => $v !== null && $v !== ''), $data['nodes']),
            'edges' => array_map(fn (array $e): array => array_filter($e, fn ($v) => $v !== null && $v !== ''), $data['edges']),
            'slug' => Str::slug($data['slug']),
        ])->save();
    }
}

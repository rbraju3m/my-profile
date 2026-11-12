<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class MessageController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $status = in_array($status, ContactMessage::STATUSES, true) ? $status : null;

        return Inertia::render('Admin/Messages/Index', [
            'status' => $status,
            'counts' => ContactMessage::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'messages' => ContactMessage::query()
                ->when($status, fn ($q) => $q->where('status', $status), fn ($q) => $q->where('status', '!=', 'spam'))
                ->latest()
                ->paginate(20)
                ->withQueryString()
                ->through(fn (ContactMessage $m): array => [
                    ...$m->only(['id', 'name', 'email', 'subject', 'status']),
                    'excerpt' => mb_strimwidth($m->message, 0, 140, '…'),
                    'created_at' => $m->created_at?->format('d M Y, H:i'),
                ]),
        ]);
    }

    public function show(ContactMessage $message): Response
    {
        if ($message->status === 'new') {
            $message->update(['status' => 'read']);
        }

        return Inertia::render('Admin/Messages/Show', [
            'message' => [
                ...$message->only(['id', 'name', 'email', 'subject', 'message', 'status', 'user_agent']),
                'created_at' => $message->created_at?->format('d M Y, H:i'),
            ],
        ]);
    }

    public function update(Request $request, ContactMessage $message): RedirectResponse
    {
        $message->update($request->validate(['status' => ['required', Rule::in(ContactMessage::STATUSES)]]));

        return back()->with('success', 'Marked as '.$message->status.'.');
    }

    public function destroy(ContactMessage $message): RedirectResponse
    {
        $message->delete();

        return redirect()->route('admin.messages.index')->with('success', 'Message deleted.');
    }
}

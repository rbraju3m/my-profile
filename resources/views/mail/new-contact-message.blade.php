New message from the portfolio contact form

From:    {{ $contact->name }} <{{ $contact->email }}>
Subject: {{ $contact->subject }}
Sent:    {{ $contact->created_at?->format('d M Y, H:i') }}

{{ $contact->message }}

---
Reply to this email to answer {{ $contact->name }} directly.
Inbox: {{ route('admin.messages.show', $contact) }}

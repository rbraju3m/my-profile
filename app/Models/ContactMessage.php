<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    public const STATUSES = ['new', 'read', 'replied', 'spam'];

    protected $fillable = ['name', 'email', 'subject', 'message', 'ip_hash', 'user_agent', 'status'];
}

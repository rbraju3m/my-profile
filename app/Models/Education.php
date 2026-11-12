<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Model;

class Education extends Model
{
    use LogsContentChanges;

    protected $table = 'education';

    protected $fillable = ['degree', 'institution', 'detail', 'started_year', 'ended_year', 'sort_order'];
}

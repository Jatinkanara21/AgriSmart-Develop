<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Crop extends Model
{
    protected $fillable = ['farm_id', 'name', 'variety', 'planting_date', 'expected_harvest_date', 'status'];
    protected $casts = ['planting_date' => 'date', 'expected_harvest_date' => 'date'];

    public function farm(): BelongsTo { return $this->belongsTo(Farm::class); }
    public function healthChecks(): HasMany { return $this->hasMany(CropHealth::class); }
}

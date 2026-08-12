<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Farm extends Model
{
    protected $fillable = ['user_id', 'name', 'location', 'area', 'soil_type'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function crops(): HasMany { return $this->hasMany(Crop::class); }
    public function records(): HasMany { return $this->hasMany(FarmRecord::class); }
}

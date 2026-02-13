<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavingsPlan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'min_amount',
        'max_amount',
        'allow_early_withdrawal',
        'status'
    ];

    protected $casts = [
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'allow_early_withdrawal' => 'boolean'
    ];

    public function durations()
    {
        return $this->hasMany(SavingsPlanDuration::class)->orderBy('lock_period_days');
    }

    public function userSavings()
    {
        return $this->hasMany(UserSaving::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavingsPlan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'interest_rate',
        'min_amount',
        'max_amount',
        'lock_period_days',
        'early_withdrawal_penalty',
        'status'
    ];

    protected $casts = [
        'interest_rate' => 'decimal:2',
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'early_withdrawal_penalty' => 'decimal:2',
        'lock_period_days' => 'integer'
    ];

    public function userSavings()
    {
        return $this->hasMany(UserSaving::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function isFlexible()
    {
        return $this->lock_period_days === 0;
    }
}

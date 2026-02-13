<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavingsPlanDuration extends Model
{
    protected $fillable = [
        'savings_plan_id',
        'lock_period_days',
        'interest_rate',
        'early_withdrawal_penalty'
    ];

    protected $casts = [
        'interest_rate' => 'decimal:2',
        'early_withdrawal_penalty' => 'decimal:2',
        'lock_period_days' => 'integer'
    ];

    public function savingsPlan()
    {
        return $this->belongsTo(SavingsPlan::class);
    }

    public function userSavings()
    {
        return $this->hasMany(UserSaving::class);
    }

    public function isFlexible()
    {
        return $this->lock_period_days === 0;
    }
}

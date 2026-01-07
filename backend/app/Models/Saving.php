<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Saving extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'target_amount',
        'current_balance',
        'initial_deposit',
        'total_returns',
        'duration_months',
        'return_rate',
        'maturity_date',
        'status'
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'initial_deposit' => 'decimal:2',
        'total_returns' => 'decimal:2',
        'return_rate' => 'decimal:2',
        'maturity_date' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Calculate compound interest returns
    public function calculateReturns()
    {
        $months = now()->diffInMonths($this->created_at);
        if ($months <= 0) return 0;
        
        $monthlyRate = ($this->return_rate / 100) / 12;
        $returns = $this->initial_deposit * (pow(1 + $monthlyRate, $months) - 1);
        
        return round($returns, 2);
    }
}

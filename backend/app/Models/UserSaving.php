<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class UserSaving extends Model
{
    protected $fillable = [
        'user_id',
        'savings_plan_id',
        'amount',
        'accrued_interest',
        'maturity_date',
        'status'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'accrued_interest' => 'decimal:2',
        'maturity_date' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function savingsPlan()
    {
        return $this->belongsTo(SavingsPlan::class);
    }

    public function calculateInterest()
    {
        $plan = $this->savingsPlan;
        $daysElapsed = Carbon::parse($this->created_at)->diffInDays(now());
        
        // Daily interest calculation
        $dailyRate = ($plan->interest_rate / 100) / 365;
        $interest = $this->amount * $dailyRate * $daysElapsed;
        
        return round($interest, 2);
    }

    public function getTotalBalanceAttribute()
    {
        return $this->amount + $this->calculateInterest();
    }

    public function canWithdraw()
    {
        // Flexible plan (no lock) or maturity date passed
        return $this->savingsPlan->lock_period_days === 0 || 
               now()->gte($this->maturity_date);
    }

    public function getWithdrawalPenalty()
    {
        if ($this->canWithdraw()) {
            return 0;
        }
        return ($this->savingsPlan->early_withdrawal_penalty / 100) * $this->amount;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'interest_rate',
        'admin_fee',
        'admin_fee_paid',
        'admin_fee_payment_id',
        'tenure_months',
        'purpose',
        'purpose_details',
        'employment_type',
        'monthly_income',
        'bank_name',
        'account_number',
        'status',
        'approved_by',
        'approved_at',
        'disbursed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'admin_fee' => 'decimal:2',
        'admin_fee_paid' => 'boolean',
        'monthly_income' => 'decimal:2',
        'approved_at' => 'datetime',
        'disbursed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function repayments()
    {
        return $this->hasMany(Repayment::class);
    }

    // Calculate EMI
    public function getEmiAttribute()
    {
        $principal = $this->amount;
        $rate = $this->interest_rate / 12 / 100;
        $tenure = $this->tenure_months;
        
        if ($rate == 0) {
            return $principal / $tenure;
        }
        
        return ($principal * $rate * pow(1 + $rate, $tenure)) / (pow(1 + $rate, $tenure) - 1);
    }

    public function getTotalPayableAttribute()
    {
        return $this->emi * $this->tenure_months;
    }

    public function getTotalInterestAttribute()
    {
        return $this->total_payable - $this->amount;
    }

    public function getTotalPaidAttribute()
    {
        return $this->repayments()->where('status', 'paid')->sum('amount');
    }

    public function getRemainingBalanceAttribute()
    {
        return $this->total_payable - $this->total_paid;
    }

    public function getNextRepaymentAttribute()
    {
        return $this->repayments()
            ->where('status', 'pending')
            ->orderBy('due_date')
            ->first();
    }
}

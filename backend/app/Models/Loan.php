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

    public function timelineSteps()
    {
        return $this->hasMany(LoanTimelineStep::class)->orderBy('step_number');
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

    /**
     * Generate progress timeline based on loan status
     */
    public function getTimelineAttribute()
    {
        $timeline = [];
        
        // Step 1: Application Submitted
        $timeline[] = [
            'step' => 1,
            'title' => 'Application Submitted',
            'description' => 'Loan application received',
            'status' => 'completed',
            'date' => $this->created_at?->format('M d, Y H:i'),
        ];
        
        // Step 2: Documents Under Review
        $step2Status = 'pending';
        if (in_array($this->status, ['pending_review', 'approved', 'disbursed', 'active', 'completed'])) {
            $step2Status = 'completed';
        } elseif ($this->status === 'pending' && $this->admin_fee_paid) {
            $step2Status = 'in_progress';
        } elseif ($this->status === 'rejected') {
            $step2Status = 'failed';
        }
        $timeline[] = [
            'step' => 2,
            'title' => 'Documents Under Review',
            'description' => 'Your documents are being verified',
            'status' => $step2Status,
            'date' => null,
        ];
        
        // Step 3: Application Reviewed
        $step3Status = 'pending';
        if (in_array($this->status, ['approved', 'disbursed', 'active', 'completed'])) {
            $step3Status = 'completed';
        } elseif ($this->status === 'pending_review') {
            $step3Status = 'in_progress';
        } elseif ($this->status === 'rejected') {
            $step3Status = 'failed';
        }
        $timeline[] = [
            'step' => 3,
            'title' => 'Application Reviewed',
            'description' => $this->status === 'rejected' ? 'Application rejected: ' . $this->rejection_reason : 'Application under final review',
            'status' => $step3Status,
            'date' => null,
        ];
        
        // Step 4: Loan Approved
        $step4Status = 'pending';
        if (in_array($this->status, ['approved', 'disbursed', 'active', 'completed'])) {
            $step4Status = 'completed';
        } elseif ($this->status === 'rejected') {
            $step4Status = 'failed';
        }
        $timeline[] = [
            'step' => 4,
            'title' => 'Loan Approved',
            'description' => 'Your loan has been approved',
            'status' => $step4Status,
            'date' => $this->approved_at?->format('M d, Y H:i'),
        ];
        
        // Step 5: Disbursement
        $step5Status = 'pending';
        if (in_array($this->status, ['disbursed', 'active', 'completed'])) {
            $step5Status = 'completed';
        } elseif ($this->status === 'approved') {
            $step5Status = 'in_progress';
        } elseif ($this->status === 'rejected') {
            $step5Status = 'failed';
        }
        $timeline[] = [
            'step' => 5,
            'title' => 'Loan Disbursed',
            'description' => 'Funds transferred to your account',
            'status' => $step5Status,
            'date' => $this->disbursed_at?->format('M d, Y H:i'),
        ];
        
        return $timeline;
    }
}

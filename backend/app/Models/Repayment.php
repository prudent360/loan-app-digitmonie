<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Repayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'amount',
        'principal',
        'interest',
        'due_date',
        'paid_at',
        'status',
        'payment_reference',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'principal' => 'decimal:2',
        'interest' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }
}

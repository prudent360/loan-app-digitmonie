<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'loan_id',
        'repayment_id',
        'amount',
        'gateway',
        'reference',
        'gateway_reference',
        'status',
        'gateway_response',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function repayment()
    {
        return $this->belongsTo(Repayment::class);
    }

    public static function generateReference()
    {
        return 'PAY-' . strtoupper(uniqid()) . '-' . time();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'reference',
        'flw_ref',
        'category',
        'biller_code',
        'biller_name',
        'item_code',
        'item_name',
        'customer_id',
        'customer_name',
        'amount',
        'fee',
        'total_amount',
        'status',
        'token',
        'failure_reason',
        'response_data',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'response_data' => 'array',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the user that made the transaction
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the transaction was successful
     */
    public function isSuccessful(): bool
    {
        return $this->status === 'successful';
    }

    /**
     * Check if the transaction is pending
     */
    public function isPending(): bool
    {
        return in_array($this->status, ['pending', 'processing']);
    }

    /**
     * Check if the transaction failed
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Get formatted amount with Naira symbol
     */
    public function getFormattedAmountAttribute(): string
    {
        return '₦' . number_format($this->amount, 2);
    }

    /**
     * Get formatted total amount with Naira symbol
     */
    public function getFormattedTotalAmountAttribute(): string
    {
        return '₦' . number_format($this->total_amount, 2);
    }

    /**
     * Get category display name
     */
    public function getCategoryDisplayAttribute(): string
    {
        $names = [
            'airtime' => 'Airtime',
            'data' => 'Data Bundle',
            'electricity' => 'Electricity',
            'cable' => 'Cable TV',
            'internet' => 'Internet',
        ];

        return $names[$this->category] ?? ucfirst($this->category);
    }

    /**
     * Generate a unique reference
     */
    public static function generateReference(): string
    {
        return 'BILL-' . strtoupper(uniqid()) . '-' . time();
    }

    /**
     * Scope for successful transactions
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'successful');
    }

    /**
     * Scope for user's transactions
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for a specific category
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}

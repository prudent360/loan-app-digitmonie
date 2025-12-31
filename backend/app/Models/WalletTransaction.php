<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'wallet_id',
        'user_id',
        'reference',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'description',
        'category',
        'source',
        'source_reference',
        'status',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'metadata' => 'array',
    ];

    /**
     * Get the wallet
     */
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if transaction is a credit
     */
    public function isCredit(): bool
    {
        return $this->type === 'credit';
    }

    /**
     * Check if transaction is a debit
     */
    public function isDebit(): bool
    {
        return $this->type === 'debit';
    }

    /**
     * Get formatted amount with sign
     */
    public function getFormattedAmountAttribute(): string
    {
        $sign = $this->isCredit() ? '+' : '-';
        return $sign . '₦' . number_format($this->amount, 2);
    }

    /**
     * Get category display name
     */
    public function getCategoryDisplayAttribute(): string
    {
        $names = [
            'funding' => 'Wallet Funding',
            'bill_payment' => 'Bill Payment',
            'card_funding' => 'Card Funding',
            'withdrawal' => 'Withdrawal',
            'refund' => 'Refund',
            'transfer' => 'Transfer',
        ];

        return $names[$this->category] ?? ucfirst(str_replace('_', ' ', $this->category ?? 'Transaction'));
    }

    /**
     * Generate unique reference
     */
    public static function generateReference(): string
    {
        return 'WLT-' . strtoupper(uniqid()) . '-' . time();
    }

    /**
     * Scope for credits
     */
    public function scopeCredits($query)
    {
        return $query->where('type', 'credit');
    }

    /**
     * Scope for debits
     */
    public function scopeDebits($query)
    {
        return $query->where('type', 'debit');
    }

    /**
     * Scope for user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}

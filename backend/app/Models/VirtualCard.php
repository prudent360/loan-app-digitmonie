<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VirtualCard extends Model
{
    protected $fillable = [
        'user_id',
        'flw_card_id',
        'card_pan',
        'masked_pan',
        'currency',
        'balance',
        'card_type',
        'status',
        'name_on_card',
        'expiry_date',
        'cvv',
        'billing_address',
        'last_funded_at',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'billing_address' => 'array',
        'expiry_date' => 'date',
        'last_funded_at' => 'datetime',
    ];

    protected $hidden = [
        'cvv', // Never expose CVV
    ];

    /**
     * Get the user that owns the card
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the card is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if the card is blocked
     */
    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }

    /**
     * Check if the card is terminated
     */
    public function isTerminated(): bool
    {
        return $this->status === 'terminated';
    }

    /**
     * Get formatted balance with currency symbol
     */
    public function getFormattedBalanceAttribute(): string
    {
        $symbols = [
            'USD' => '$',
            'NGN' => '₦',
            'GBP' => '£',
            'EUR' => '€',
        ];

        $symbol = $symbols[$this->currency] ?? $this->currency . ' ';
        return $symbol . number_format($this->balance, 2);
    }

    /**
     * Scope for active cards
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for user's cards
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}

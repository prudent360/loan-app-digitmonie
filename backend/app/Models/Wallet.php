<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    protected $fillable = [
        'user_id',
        'balance',
        'currency',
        'is_active',
        'is_locked',
        'lock_reason',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
    ];

    /**
     * Get the user that owns the wallet
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all transactions for this wallet
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Check if wallet can be debited
     */
    public function canDebit(float $amount): bool
    {
        return $this->is_active && !$this->is_locked && $this->balance >= $amount;
    }

    /**
     * Check if wallet is usable
     */
    public function isUsable(): bool
    {
        return $this->is_active && !$this->is_locked;
    }

    /**
     * Get formatted balance with currency symbol
     */
    public function getFormattedBalanceAttribute(): string
    {
        $symbols = [
            'NGN' => '₦',
            'USD' => '$',
            'GBP' => '£',
            'EUR' => '€',
        ];

        $symbol = $symbols[$this->currency] ?? $this->currency . ' ';
        return $symbol . number_format($this->balance, 2);
    }

    /**
     * Credit the wallet
     */
    public function credit(float $amount, string $description, ?string $category = null, ?string $source = null, ?string $sourceRef = null, array $metadata = []): WalletTransaction
    {
        $balanceBefore = $this->balance;
        $this->increment('balance', $amount);
        
        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'reference' => WalletTransaction::generateReference(),
            'type' => 'credit',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->fresh()->balance,
            'description' => $description,
            'category' => $category,
            'source' => $source,
            'source_reference' => $sourceRef,
            'status' => 'completed',
            'metadata' => $metadata,
        ]);
    }

    /**
     * Debit the wallet
     */
    public function debit(float $amount, string $description, ?string $category = null, ?string $source = null, ?string $sourceRef = null, array $metadata = []): WalletTransaction
    {
        if (!$this->canDebit($amount)) {
            throw new \Exception('Insufficient wallet balance or wallet is locked');
        }

        $balanceBefore = $this->balance;
        $this->decrement('balance', $amount);
        
        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'reference' => WalletTransaction::generateReference(),
            'type' => 'debit',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->fresh()->balance,
            'description' => $description,
            'category' => $category,
            'source' => $source,
            'source_reference' => $sourceRef,
            'status' => 'completed',
            'metadata' => $metadata,
        ]);
    }

    /**
     * Get or create wallet for a user
     */
    public static function getOrCreateForUser(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0, 'currency' => 'NGN', 'is_active' => true]
        );
    }
}

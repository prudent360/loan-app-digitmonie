<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\FlutterwaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    protected FlutterwaveService $flutterwaveService;

    public function __construct(FlutterwaveService $flutterwaveService)
    {
        $this->flutterwaveService = $flutterwaveService;
    }

    /**
     * Get wallet balance and summary
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $wallet = Wallet::getOrCreateForUser($user->id);

        // Recent transactions
        $transactions = $wallet->transactions()
            ->latest()
            ->take(10)
            ->get();

        // Calculate totals for this month
        $monthStart = now()->startOfMonth();
        $monthlyCredits = $wallet->transactions()
            ->where('type', 'credit')
            ->where('created_at', '>=', $monthStart)
            ->sum('amount');
        $monthlyDebits = $wallet->transactions()
            ->where('type', 'debit')
            ->where('created_at', '>=', $monthStart)
            ->sum('amount');

        return response()->json([
            'success' => true,
            'wallet' => [
                'id' => $wallet->id,
                'balance' => $wallet->balance,
                'formatted_balance' => $wallet->formatted_balance,
                'currency' => $wallet->currency,
                'is_active' => $wallet->is_active,
                'is_locked' => $wallet->is_locked,
            ],
            'summary' => [
                'monthly_credits' => $monthlyCredits,
                'monthly_debits' => $monthlyDebits,
            ],
            'recent_transactions' => $transactions,
        ]);
    }

    /**
     * Get wallet transactions with pagination
     */
    public function transactions(Request $request)
    {
        $user = $request->user();
        $wallet = Wallet::getOrCreateForUser($user->id);

        $query = $wallet->transactions()->latest();

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $transactions = $query->paginate(20);

        return response()->json([
            'success' => true,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Initialize wallet funding via Flutterwave
     */
    public function initializeFunding(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100|max:1000000',
        ]);

        $user = $request->user();
        $wallet = Wallet::getOrCreateForUser($user->id);

        if (!$wallet->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Wallet is not active',
            ], 400);
        }

        if ($wallet->is_locked) {
            return response()->json([
                'success' => false,
                'message' => 'Wallet is currently locked. ' . ($wallet->lock_reason ?? ''),
            ], 400);
        }

        $amount = (float) $request->amount;
        $reference = 'WFUND-' . strtoupper(uniqid()) . '-' . time();

        // Use the frontend callback URL - redirect back to wallet page
        $callbackUrl = config('app.frontend_url', 'http://localhost:3000') . '/wallet';

        try {
            $response = $this->flutterwaveService->initializeTransaction(
                $user->email,
                $amount,
                $reference,
                $callbackUrl,
                $user->name,
                [
                    'type' => 'wallet_funding',
                    'wallet_id' => $wallet->id,
                    'user_id' => $user->id,
                ]
            );

            if ($response['status'] === 'success') {
                // Create pending transaction record
                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'user_id' => $user->id,
                    'reference' => $reference,
                    'type' => 'credit',
                    'amount' => $amount,
                    'balance_before' => $wallet->balance,
                    'balance_after' => $wallet->balance, // Will update on verification
                    'description' => 'Wallet funding via Flutterwave',
                    'category' => 'funding',
                    'source' => 'flutterwave',
                    'source_reference' => $reference,
                    'status' => 'pending',
                    'metadata' => [
                        'flutterwave_link' => $response['data']['link'] ?? null,
                    ],
                ]);

                return response()->json([
                    'success' => true,
                    'reference' => $reference,
                    'payment_link' => $response['data']['link'] ?? null,
                    'message' => 'Payment initialized',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $response['message'] ?? 'Failed to initialize payment',
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment initialization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify wallet funding payment
     */
    public function verifyFunding(Request $request)
    {
        $request->validate([
            'reference' => 'required|string',
            'transaction_id' => 'required|string',
        ]);

        $user = $request->user();
        $reference = $request->reference;
        $transactionId = $request->transaction_id;

        // Find the pending transaction
        $walletTx = WalletTransaction::where('reference', $reference)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$walletTx) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found or already processed',
            ], 404);
        }

        try {
            $response = $this->flutterwaveService->verifyTransaction($transactionId);

            if ($response['status'] === 'success' && $response['data']['status'] === 'successful') {
                $wallet = $walletTx->wallet;
                
                // Update wallet balance and transaction
                DB::transaction(function () use ($wallet, $walletTx, $response) {
                    $wallet->increment('balance', $walletTx->amount);
                    
                    $walletTx->update([
                        'status' => 'completed',
                        'balance_after' => $wallet->fresh()->balance,
                        'source_reference' => $response['data']['flw_ref'] ?? $walletTx->source_reference,
                        'metadata' => array_merge($walletTx->metadata ?? [], [
                            'flutterwave_response' => $response['data'],
                            'verified_at' => now()->toISOString(),
                        ]),
                    ]);
                });

                return response()->json([
                    'success' => true,
                    'message' => 'Wallet funded successfully',
                    'wallet' => [
                        'balance' => $wallet->fresh()->balance,
                        'formatted_balance' => $wallet->fresh()->formatted_balance,
                    ],
                    'transaction' => $walletTx->fresh(),
                ]);
            }

            // Payment failed
            $walletTx->update([
                'status' => 'failed',
                'metadata' => array_merge($walletTx->metadata ?? [], [
                    'failure_reason' => $response['data']['status'] ?? 'Unknown',
                    'flutterwave_response' => $response['data'] ?? null,
                ]),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed',
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Verification error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Transfer to another user (future feature)
     */
    public function transfer(Request $request)
    {
        // TODO: Implement peer-to-peer transfers
        return response()->json([
            'success' => false,
            'message' => 'Feature coming soon',
        ], 501);
    }
}

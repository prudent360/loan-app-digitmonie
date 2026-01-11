<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransferController extends Controller
{
    /**
     * List all transfer requests
     */
    public function index(Request $request)
    {
        $query = TransferRequest::with(['user', 'approver'])
            ->latest();

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $requests = $query->paginate(20);

        // Stats
        $stats = [
            'pending' => TransferRequest::pending()->count(),
            'approved' => TransferRequest::approved()->count(),
            'total_approved' => TransferRequest::approved()->sum('amount'),
        ];

        return response()->json([
            'requests' => $requests,
            'stats' => $stats,
        ]);
    }

    /**
     * Approve a transfer request and credit wallet
     */
    public function approve(Request $request, TransferRequest $transferRequest)
    {
        if ($transferRequest->status !== 'pending') {
            return response()->json([
                'message' => 'This request has already been processed'
            ], 400);
        }

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            DB::transaction(function () use ($transferRequest, $request) {
                // Update request status
                $transferRequest->update([
                    'status' => 'approved',
                    'admin_notes' => $request->notes,
                    'approved_by' => auth()->id(),
                    'processed_at' => now(),
                ]);

                // Get or create user wallet
                $wallet = Wallet::getOrCreateForUser($transferRequest->user_id);

                // Credit wallet
                $balanceBefore = $wallet->balance;
                $wallet->increment('balance', $transferRequest->amount);

                // Create transaction record
                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'user_id' => $transferRequest->user_id,
                    'reference' => 'BT-' . strtoupper(uniqid()),
                    'type' => 'credit',
                    'amount' => $transferRequest->amount,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $wallet->fresh()->balance,
                    'description' => 'Bank transfer funding - Ref: ' . $transferRequest->reference,
                    'category' => 'funding',
                    'source' => 'bank_transfer',
                    'source_reference' => $transferRequest->reference,
                    'status' => 'completed',
                ]);
            });

            return response()->json([
                'message' => 'Transfer approved and wallet credited',
                'request' => $transferRequest->fresh()->load(['user', 'approver']),
            ]);

        } catch (\Exception $e) {
            Log::error('Transfer approval failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to approve transfer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a transfer request
     */
    public function reject(Request $request, TransferRequest $transferRequest)
    {
        if ($transferRequest->status !== 'pending') {
            return response()->json([
                'message' => 'This request has already been processed'
            ], 400);
        }

        $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $transferRequest->update([
            'status' => 'rejected',
            'admin_notes' => $request->notes,
            'approved_by' => auth()->id(),
            'processed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Transfer request rejected',
            'request' => $transferRequest->fresh()->load(['user', 'approver']),
        ]);
    }
}

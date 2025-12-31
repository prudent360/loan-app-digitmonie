<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\BillTransaction;
use App\Services\FlutterwaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BillPaymentController extends Controller
{
    protected $flutterwave;

    public function __construct(FlutterwaveService $flutterwave)
    {
        $this->flutterwave = $flutterwave;
    }

    /**
     * Get bill payment categories
     */
    public function categories()
    {
        try {
            $response = $this->flutterwave->getBillCategories();

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch categories',
                ], 400);
            }

            // Filter to common categories
            $commonCategories = ['AIRTIME', 'DATA_BUNDLE', 'POWER', 'CABLE', 'INTERNET'];
            $categories = collect($response['data'] ?? [])
                ->filter(fn($cat) => in_array(strtoupper($cat['biller_code'] ?? $cat['name'] ?? ''), $commonCategories) 
                    || in_array(strtoupper($cat['name'] ?? ''), $commonCategories))
                ->values();

            return response()->json([
                'success' => true,
                'categories' => $response['data'] ?? [],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch bill categories: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories',
            ], 500);
        }
    }

    /**
     * Get billers for a specific category
     */
    public function billers(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
            'country' => 'sometimes|string|size:2',
        ]);

        try {
            $response = $this->flutterwave->getBillers(
                $request->category,
                $request->country ?? 'NG'
            );

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch billers',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'billers' => $response['data'] ?? [],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch billers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch billers',
            ], 500);
        }
    }

    /**
     * Get bill items/packages for a biller
     */
    public function items(Request $request)
    {
        $request->validate([
            'biller_code' => 'required|string',
        ]);

        try {
            $response = $this->flutterwave->getBillItems($request->biller_code);

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch bill items',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'items' => $response['data'] ?? [],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch bill items: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch bill items',
            ], 500);
        }
    }

    /**
     * Validate customer for bill payment
     */
    public function validateCustomer(Request $request)
    {
        $request->validate([
            'item_code' => 'required|string',
            'biller_code' => 'required|string',
            'customer_id' => 'required|string',
        ]);

        try {
            $response = $this->flutterwave->validateBillCustomer(
                $request->item_code,
                $request->biller_code,
                $request->customer_id
            );

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => $response['message'] ?? 'Customer validation failed',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'customer' => $response['data'] ?? [],
            ]);

        } catch (\Exception $e) {
            Log::error('Customer validation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate customer',
            ], 500);
        }
    }

    /**
     * Process a bill payment from wallet
     */
    public function pay(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
            'biller_code' => 'required|string',
            'biller_name' => 'required|string',
            'item_code' => 'nullable|string',
            'item_name' => 'nullable|string',
            'customer_id' => 'required|string',
            'customer_name' => 'nullable|string',
            'amount' => 'required|numeric|min:50',
            'type' => 'required|string', // AIRTIME, DATA, etc.
        ]);

        $user = Auth::user();
        $reference = BillTransaction::generateReference();
        $fee = $this->calculateFee($request->amount, $request->category);
        $totalAmount = (float) $request->amount + $fee;

        // Get user's wallet
        $wallet = \App\Models\Wallet::getOrCreateForUser($user->id);

        // Check wallet balance
        if ($wallet->balance < $totalAmount) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient wallet balance. You need ₦' . number_format((float)$totalAmount, 2) . ' but have ₦' . number_format((float)$wallet->balance, 2),
                'required' => $totalAmount,
                'balance' => $wallet->balance,
            ], 400);
        }

        // Create transaction record
        $transaction = BillTransaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'category' => strtolower($request->category),
            'biller_code' => $request->biller_code,
            'biller_name' => $request->biller_name,
            'item_code' => $request->item_code,
            'item_name' => $request->item_name,
            'customer_id' => $request->customer_id,
            'customer_name' => $request->customer_name,
            'amount' => $request->amount,
            'fee' => $fee,
            'total_amount' => $totalAmount,
            'status' => 'pending',
        ]);

        try {
            // Call Flutterwave to process the bill
            // SIMULATION: If in test mode, mock success
            if (!$this->flutterwave->isLiveMode()) {
                $response = [
                    'status' => 'success',
                    'message' => 'Bill payment successful (Test Mode)',
                    'data' => [
                        'flw_ref' => 'TEST-' . $reference,
                        'token' => 'TEST-TOKEN-' . rand(1000, 9999), 
                        'recharge_token' => 'TEST-recharge-' . rand(1000, 9999),
                        'amount' => $request->amount,
                        'phone_number' => $request->customer_id
                    ]
                ];
            } else {
                $response = $this->flutterwave->payBill([
                    'country' => 'NG',
                    'customer_id' => $request->customer_id,
                    'amount' => $request->amount,
                    'type' => strtoupper($request->type),
                    'reference' => $reference,
                    'biller_name' => $request->biller_name,
                ]);
            }

            if ($response['status'] === 'success') {
                // Debit wallet
                $wallet->debit(
                    $totalAmount,
                    'Bill payment: ' . $request->biller_name . ' - ' . $request->customer_id,
                    $reference,
                    'bill_payment',
                    'flutterwave',
                    $response['data']['flw_ref'] ?? $reference
                );

                $transaction->update([
                    'status' => 'successful',
                    'flw_ref' => $response['data']['flw_ref'] ?? null,
                    'token' => $response['data']['token'] ?? $response['data']['recharge_token'] ?? null,
                    'response_data' => $response['data'] ?? null,
                    'completed_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Bill payment successful',
                    'transaction' => $transaction->fresh(),
                    'token' => $transaction->token,
                    'wallet_balance' => $wallet->fresh()->formatted_balance,
                ]);
            } else {
                $transaction->update([
                    'status' => 'failed',
                    'failure_reason' => $response['message'] ?? 'Payment failed',
                    'response_data' => $response,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $response['message'] ?? 'Bill payment failed. Please contact support.',
                    'transaction' => $transaction->fresh(),
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Bill payment failed: ' . $e->getMessage());
            
            $transaction->update([
                'status' => 'failed',
                'failure_reason' => 'System error: ' . $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bill payment failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Get bill payment history for the user
     */
    public function history(Request $request)
    {
        $query = BillTransaction::forUser(Auth::id())
            ->orderBy('created_at', 'desc');

        if ($request->category) {
            $query->category($request->category);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $transactions = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Get a specific transaction
     */
    public function show($id)
    {
        $transaction = BillTransaction::forUser(Auth::id())->findOrFail($id);

        return response()->json([
            'success' => true,
            'transaction' => $transaction,
        ]);
    }

    /**
     * Calculate transaction fee based on category
     */
    private function calculateFee($amount, $category): float
    {
        // You can customize fees per category
        $feeRates = [
            'airtime' => 0, // No fee for airtime
            'data' => 0,
            'electricity' => 100, // Flat N100 for electricity
            'cable' => 100,
            'internet' => 50,
        ];

        return $feeRates[strtolower($category)] ?? 0;
    }
}

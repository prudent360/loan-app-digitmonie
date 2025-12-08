<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Loan;
use App\Models\Repayment;
use App\Models\Setting;
use App\Services\PaystackService;
use App\Services\FlutterwaveService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function getGatewayConfig()
    {
        $settings = Setting::getValue('payment_gateways', []);
        
        return response()->json([
            'active_gateway' => $settings['active_gateway'] ?? 'paystack',
            'paystack' => [
                'public_key' => $settings['paystack']['public_key'] ?? '',
                'enabled' => $settings['paystack']['enabled'] ?? false,
            ],
            'flutterwave' => [
                'public_key' => $settings['flutterwave']['public_key'] ?? '',
                'enabled' => $settings['flutterwave']['enabled'] ?? false,
            ],
        ]);
    }

    public function initializePayment(Request $request)
    {
        $request->validate([
            'loan_id' => 'required|exists:loans,id',
            'repayment_id' => 'nullable|exists:repayments,id',
            'amount' => 'required|numeric|min:100',
        ]);

        $user = $request->user();
        $loan = Loan::findOrFail($request->loan_id);

        // Ensure user owns this loan
        if ($loan->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $settings = Setting::getValue('payment_gateways', []);
        $activeGateway = $settings['active_gateway'] ?? 'paystack';
        $reference = Payment::generateReference();
        $callbackUrl = config('app.frontend_url', 'http://localhost:5173') . '/payment/callback';

        // Create payment record
        $payment = Payment::create([
            'user_id' => $user->id,
            'loan_id' => $loan->id,
            'repayment_id' => $request->repayment_id,
            'amount' => $request->amount,
            'gateway' => $activeGateway,
            'reference' => $reference,
            'status' => 'pending',
        ]);

        $metadata = [
            'payment_id' => $payment->id,
            'loan_id' => $loan->id,
            'repayment_id' => $request->repayment_id,
            'user_id' => $user->id,
        ];

        if ($activeGateway === 'paystack') {
            $paystack = new PaystackService();
            
            if (!$paystack->isConfigured()) {
                return response()->json(['message' => 'Payment gateway not configured'], 503);
            }

            $result = $paystack->initializeTransaction(
                $user->email,
                $request->amount,
                $reference,
                $callbackUrl,
                $metadata
            );

            if ($result['status'] ?? false) {
                return response()->json([
                    'message' => 'Payment initialized',
                    'gateway' => 'paystack',
                    'authorization_url' => $result['data']['authorization_url'],
                    'reference' => $reference,
                ]);
            }

            return response()->json(['message' => 'Failed to initialize payment', 'error' => $result['message'] ?? 'Unknown error'], 400);
        } 
        
        if ($activeGateway === 'flutterwave') {
            $flutterwave = new FlutterwaveService();
            
            if (!$flutterwave->isConfigured()) {
                return response()->json(['message' => 'Payment gateway not configured'], 503);
            }

            $result = $flutterwave->initializeTransaction(
                $user->email,
                $request->amount,
                $reference,
                $callbackUrl,
                $user->name,
                $metadata
            );

            if ($result['status'] === 'success') {
                return response()->json([
                    'message' => 'Payment initialized',
                    'gateway' => 'flutterwave',
                    'authorization_url' => $result['data']['link'],
                    'reference' => $reference,
                ]);
            }

            return response()->json(['message' => 'Failed to initialize payment', 'error' => $result['message'] ?? 'Unknown error'], 400);
        }

        return response()->json(['message' => 'Invalid payment gateway'], 400);
    }

    public function verifyPayment(Request $request)
    {
        $request->validate([
            'reference' => 'required|string',
            'transaction_id' => 'nullable|string', // For Flutterwave
        ]);

        $payment = Payment::where('reference', $request->reference)->firstOrFail();

        if ($payment->status === 'success') {
            return response()->json(['message' => 'Payment already verified', 'payment' => $payment]);
        }

        if ($payment->gateway === 'paystack') {
            $paystack = new PaystackService();
            $result = $paystack->verifyTransaction($request->reference);

            if (($result['data']['status'] ?? '') === 'success') {
                $this->markPaymentSuccess($payment, $result);
                return response()->json(['message' => 'Payment successful', 'payment' => $payment->fresh()]);
            }

            $payment->update(['status' => 'failed', 'gateway_response' => $result]);
            return response()->json(['message' => 'Payment verification failed'], 400);
        }

        if ($payment->gateway === 'flutterwave') {
            $flutterwave = new FlutterwaveService();
            $result = $flutterwave->verifyTransaction($request->transaction_id);

            if (($result['data']['status'] ?? '') === 'successful') {
                $this->markPaymentSuccess($payment, $result);
                return response()->json(['message' => 'Payment successful', 'payment' => $payment->fresh()]);
            }

            $payment->update(['status' => 'failed', 'gateway_response' => $result]);
            return response()->json(['message' => 'Payment verification failed'], 400);
        }

        return response()->json(['message' => 'Invalid gateway'], 400);
    }

    protected function markPaymentSuccess($payment, $gatewayResponse)
    {
        $payment->update([
            'status' => 'success',
            'gateway_response' => $gatewayResponse,
            'gateway_reference' => $gatewayResponse['data']['id'] ?? $gatewayResponse['data']['reference'] ?? null,
            'paid_at' => now(),
        ]);

        // If linked to a specific repayment, mark it as paid
        if ($payment->repayment_id) {
            $repayment = Repayment::find($payment->repayment_id);
            if ($repayment) {
                $repayment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'payment_reference' => $payment->reference,
                ]);
            }
        }

        // Update loan total_paid (if loan tracks this)
        $loan = $payment->loan;
        if ($loan) {
            // Check if all repayments are paid
            $pendingCount = $loan->repayments()->where('status', 'pending')->count();
            if ($pendingCount === 0) {
                $loan->update(['status' => 'completed']);
            }
        }
    }

    public function getPaymentHistory(Request $request)
    {
        $payments = Payment::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($payments);
    }
}

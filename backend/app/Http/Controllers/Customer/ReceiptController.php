<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\BillTransaction;
use App\Models\WalletTransaction;
use App\Services\ReceiptService;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    protected ReceiptService $receiptService;

    public function __construct(ReceiptService $receiptService)
    {
        $this->receiptService = $receiptService;
    }

    /**
     * Download bill payment receipt
     */
    public function billReceipt(Request $request, $id)
    {
        $user = $request->user();
        
        $transaction = BillTransaction::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        $pdf = $this->receiptService->generateBillReceipt($transaction);
        
        $filename = 'receipt-' . $transaction->reference . '.pdf';
        
        return $pdf->download($filename);
    }

    /**
     * Download wallet transaction receipt
     */
    public function walletReceipt(Request $request, $id)
    {
        $user = $request->user();
        
        $transaction = WalletTransaction::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        $pdf = $this->receiptService->generateWalletReceipt($transaction);
        
        $filename = 'wallet-receipt-' . $transaction->reference . '.pdf';
        
        return $pdf->download($filename);
    }

    /**
     * Stream bill receipt (for preview in browser)
     */
    public function streamBillReceipt(Request $request, $id)
    {
        $user = $request->user();
        
        $transaction = BillTransaction::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        $pdf = $this->receiptService->generateBillReceipt($transaction);
        
        return $pdf->stream('receipt-' . $transaction->reference . '.pdf');
    }

    /**
     * Stream wallet receipt (for preview in browser)
     */
    public function streamWalletReceipt(Request $request, $id)
    {
        $user = $request->user();
        
        $transaction = WalletTransaction::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        $pdf = $this->receiptService->generateWalletReceipt($transaction);
        
        return $pdf->stream('wallet-receipt-' . $transaction->reference . '.pdf');
    }
}

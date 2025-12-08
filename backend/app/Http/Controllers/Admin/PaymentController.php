<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Loan;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['user', 'loan']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by gateway
        if ($request->has('gateway') && $request->gateway !== 'all') {
            $query->where('gateway', $request->gateway);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $payments = $query->orderBy('created_at', 'desc')->get();

        return response()->json($payments);
    }

    public function getLoanRepayments($loanId)
    {
        $loan = Loan::with(['user', 'repayments'])->findOrFail($loanId);

        return response()->json([
            'loan' => $loan,
            'repayments' => $loan->repayments,
        ]);
    }
}

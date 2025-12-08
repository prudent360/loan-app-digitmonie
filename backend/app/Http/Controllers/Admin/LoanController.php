<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Repayment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        $query = Loan::with('user');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $loans = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($loans);
    }

    public function show(Loan $loan)
    {
        $loan->load(['user', 'repayments', 'approver']);
        
        return response()->json([
            'loan' => $loan,
            'emi' => round($loan->emi, 2),
            'total_payable' => round($loan->total_payable, 2),
            'total_paid' => round($loan->total_paid, 2),
        ]);
    }

    public function approve(Request $request, Loan $loan)
    {
        if ($loan->status !== 'pending') {
            return response()->json(['message' => 'Loan cannot be approved'], 422);
        }

        $loan->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Loan approved successfully',
            'loan' => $loan,
        ]);
    }

    public function reject(Request $request, Loan $loan)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if ($loan->status !== 'pending') {
            return response()->json(['message' => 'Loan cannot be rejected'], 422);
        }

        $loan->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Loan rejected',
            'loan' => $loan,
        ]);
    }

    public function disburse(Request $request, Loan $loan)
    {
        if ($loan->status !== 'approved') {
            return response()->json(['message' => 'Loan must be approved first'], 422);
        }

        $loan->update([
            'status' => 'disbursed',
            'disbursed_at' => now(),
        ]);

        // Generate repayment schedule
        $this->generateRepaymentSchedule($loan);

        // Update to active after disbursement
        $loan->update(['status' => 'active']);

        return response()->json([
            'message' => 'Loan disbursed successfully',
            'loan' => $loan->load('repayments'),
        ]);
    }

    private function generateRepaymentSchedule(Loan $loan)
    {
        $emi = $loan->emi;
        $monthlyRate = $loan->interest_rate / 12 / 100;
        $balance = $loan->amount;

        for ($i = 1; $i <= $loan->tenure_months; $i++) {
            $interest = $balance * $monthlyRate;
            $principal = $emi - $interest;
            $balance -= $principal;

            Repayment::create([
                'loan_id' => $loan->id,
                'amount' => round($emi, 2),
                'principal' => round($principal, 2),
                'interest' => round($interest, 2),
                'due_date' => Carbon::parse($loan->disbursed_at)->addMonths($i),
                'status' => 'pending',
            ]);
        }
    }
}

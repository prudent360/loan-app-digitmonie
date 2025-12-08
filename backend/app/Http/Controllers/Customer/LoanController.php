<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Repayment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        $loans = $request->user()->loans()
            ->with(['repayments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->id,
                    'amount' => $loan->amount,
                    'interest_rate' => $loan->interest_rate,
                    'tenure_months' => $loan->tenure_months,
                    'purpose' => $loan->purpose,
                    'status' => $loan->status,
                    'emi' => round($loan->emi, 2),
                    'total_payable' => round($loan->total_payable, 2),
                    'total_paid' => round($loan->total_paid, 2),
                    'remaining_balance' => round($loan->remaining_balance, 2),
                    'created_at' => $loan->created_at->format('Y-m-d'),
                ];
            });

        return response()->json($loans);
    }

    public function show(Request $request, Loan $loan)
    {
        if ($loan->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $loan->load('repayments');
        
        return response()->json([
            'id' => $loan->id,
            'amount' => $loan->amount,
            'interest_rate' => $loan->interest_rate,
            'tenure_months' => $loan->tenure_months,
            'purpose' => $loan->purpose,
            'purpose_details' => $loan->purpose_details,
            'status' => $loan->status,
            'emi' => round($loan->emi, 2),
            'total_payable' => round($loan->total_payable, 2),
            'total_interest' => round($loan->total_interest, 2),
            'total_paid' => round($loan->total_paid, 2),
            'remaining_balance' => round($loan->remaining_balance, 2),
            'next_payment' => $loan->next_repayment,
            'created_at' => $loan->created_at->format('Y-m-d'),
            'approved_at' => $loan->approved_at?->format('Y-m-d'),
            'disbursed_at' => $loan->disbursed_at?->format('Y-m-d'),
            'repayments' => $loan->repayments,
        ]);
    }

    public function store(Request $request)
    {
        // Get loan settings from database
        $loanSettings = \App\Models\Setting::getValue('loan_settings', [
            'min_amount' => 50000,
            'max_amount' => 5000000,
            'min_tenure' => 3,
            'max_tenure' => 36,
            'default_interest_rate' => 15,
        ]);

        $request->validate([
            'amount' => 'required|numeric|min:' . $loanSettings['min_amount'] . '|max:' . $loanSettings['max_amount'],
            'tenure_months' => 'required|integer|min:' . $loanSettings['min_tenure'] . '|max:' . $loanSettings['max_tenure'],
            'purpose' => 'required|string|max:255',
            'purpose_details' => 'nullable|string',
            'employment_type' => 'required|string',
            'monthly_income' => 'required|numeric|min:0',
            'bank_name' => 'required|string|max:100',
            'account_number' => 'required|string|size:10',
        ]);

        $loan = Loan::create([
            'user_id' => $request->user()->id,
            'amount' => $request->amount,
            'interest_rate' => $loanSettings['default_interest_rate'],
            'tenure_months' => $request->tenure_months,
            'purpose' => $request->purpose,
            'purpose_details' => $request->purpose_details,
            'employment_type' => $request->employment_type,
            'monthly_income' => $request->monthly_income,
            'bank_name' => $request->bank_name,
            'account_number' => $request->account_number,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Loan application submitted successfully',
            'loan' => $loan,
        ], 201);
    }

    public function repayments(Request $request, Loan $loan)
    {
        if ($loan->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($loan->repayments);
    }

    public function recordPayment(Request $request, Loan $loan)
    {
        if ($loan->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'repayment_id' => 'required|exists:repayments,id',
            'payment_reference' => 'required|string',
        ]);

        $repayment = Repayment::find($request->repayment_id);
        
        if ($repayment->loan_id !== $loan->id) {
            return response()->json(['message' => 'Invalid repayment'], 400);
        }

        $repayment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_reference' => $request->payment_reference,
        ]);

        // Check if all repayments are paid
        $pendingCount = $loan->repayments()->where('status', 'pending')->count();
        if ($pendingCount === 0) {
            $loan->update(['status' => 'completed']);
        }

        return response()->json([
            'message' => 'Payment recorded successfully',
            'repayment' => $repayment,
        ]);
    }
}

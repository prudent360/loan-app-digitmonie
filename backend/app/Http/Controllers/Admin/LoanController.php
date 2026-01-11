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
        
        // Get user's KYC documents as loan documents
        $documents = [];
        if ($loan->user) {
            $kycDocs = \App\Models\KycDocument::where('user_id', $loan->user_id)->get();
            $documents = $kycDocs->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'name' => $doc->document_type ?? 'Document',
                    'type' => $doc->document_type,
                    'status' => $doc->status,
                    'url' => $doc->document_url ?? null,
                    'created_at' => $doc->created_at,
                ];
            });
        }
        
        return response()->json([
            'id' => $loan->id,
            'amount' => $loan->amount,
            'interest_rate' => $loan->interest_rate,
            'tenure_months' => $loan->tenure_months,
            'purpose' => $loan->purpose,
            'purpose_details' => $loan->purpose_details,
            'status' => $loan->status,
            'rejection_reason' => $loan->rejection_reason,
            'bank_name' => $loan->bank_name,
            'account_number' => $loan->account_number,
            'monthly_income' => $loan->monthly_income,
            'employment_type' => $loan->employment_type,
            'admin_fee' => round($loan->admin_fee ?? 0, 2),
            'admin_fee_paid' => $loan->admin_fee_paid ?? false,
            'emi' => round($loan->emi ?? 0, 2),
            'total_payable' => round($loan->total_payable ?? 0, 2),
            'total_paid' => round($loan->total_paid ?? 0, 2),
            'created_at' => $loan->created_at,
            'approved_at' => $loan->approved_at,
            'disbursed_at' => $loan->disbursed_at,
            'user' => $loan->user ? [
                'id' => $loan->user->id,
                'name' => $loan->user->name,
                'email' => $loan->user->email,
                'phone' => $loan->user->phone,
            ] : null,
            'documents' => $documents,
            'repayments' => $loan->repayments,
        ]);
    }

    public function approve(Request $request, Loan $loan)
    {
        // Allow approval from pending (zero fee) or pending_review (fee paid)
        if (!in_array($loan->status, ['pending', 'pending_review'])) {
            return response()->json(['message' => 'Loan cannot be approved'], 422);
        }

        // Check if admin fee is required and paid
        if ($loan->admin_fee > 0 && !$loan->admin_fee_paid) {
            return response()->json(['message' => 'Admin fee must be paid before approval'], 422);
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

        if (!in_array($loan->status, ['pending', 'pending_review'])) {
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

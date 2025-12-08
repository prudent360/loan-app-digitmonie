<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KycDocument;
use Illuminate\Http\Request;

class KycController extends Controller
{
    public function index(Request $request)
    {
        $query = KycDocument::with('user');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($documents);
    }

    public function approve(Request $request, KycDocument $document)
    {
        if ($document->status !== 'pending') {
            return response()->json(['message' => 'Document already reviewed'], 422);
        }

        $document->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Check if all documents are approved - auto-verify user's KYC
        $this->checkAndUpdateUserKycStatus($document->user);

        return response()->json([
            'message' => 'Document approved',
            'document' => $document,
        ]);
    }

    public function reject(Request $request, KycDocument $document)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if ($document->status !== 'pending') {
            return response()->json(['message' => 'Document already reviewed'], 422);
        }

        $document->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Document rejected',
            'document' => $document,
        ]);
    }

    /**
     * Check if user has all required documents approved and update their kyc_status
     */
    private function checkAndUpdateUserKycStatus($user)
    {
        $requiredTypes = ['id_card', 'passport', 'utility_bill', 'bank_statement'];
        
        // Get approved document types for this user
        $approvedTypes = $user->kycDocuments()
            ->where('status', 'approved')
            ->pluck('document_type')
            ->toArray();

        // Check if user has at least one ID (id_card OR passport) and utility_bill and bank_statement
        $hasValidId = in_array('id_card', $approvedTypes) || in_array('passport', $approvedTypes);
        $hasUtilityBill = in_array('utility_bill', $approvedTypes);
        $hasBankStatement = in_array('bank_statement', $approvedTypes);

        // If user has valid ID + utility bill + bank statement, verify their KYC
        if ($hasValidId && $hasUtilityBill && $hasBankStatement) {
            $user->update(['kyc_status' => 'verified']);
        }
    }
}

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
     * Check if user has all their uploaded documents approved and update their kyc_status
     */
    private function checkAndUpdateUserKycStatus($user)
    {
        // Get all user's KYC documents
        $allDocuments = $user->kycDocuments()->get();
        
        // If no documents, stay pending
        if ($allDocuments->isEmpty()) {
            return;
        }
        
        // Check if there are any pending documents
        $hasPending = $allDocuments->where('status', 'pending')->count() > 0;
        
        // Check if all documents are approved (no pending and no rejected with pending status)
        $allApproved = $allDocuments->every(fn($doc) => $doc->status === 'approved');
        
        if ($allApproved) {
            $user->update(['kyc_status' => 'verified']);
        }
    }
}

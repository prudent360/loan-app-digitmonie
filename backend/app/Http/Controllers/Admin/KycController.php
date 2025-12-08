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
}

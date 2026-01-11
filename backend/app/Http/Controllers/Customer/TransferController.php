<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TransferController extends Controller
{
    /**
     * List user's transfer requests
     */
    public function index()
    {
        $requests = auth()->user()
            ->transferRequests()
            ->latest()
            ->paginate(10);

        return response()->json($requests);
    }

    /**
     * Submit a new bank transfer request
     */
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'reference' => 'required|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'proof' => 'nullable|image|max:5120', // 5MB max
        ]);

        // Check for duplicate reference
        $exists = TransferRequest::where('reference', $request->reference)
            ->where('status', '!=', 'rejected')
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A transfer with this reference already exists'
            ], 400);
        }

        // Handle proof upload
        $proofUrl = null;
        if ($request->hasFile('proof')) {
            $path = $request->file('proof')->store('transfer-proofs', 'public');
            $proofUrl = '/storage/' . $path;
        }

        $transferRequest = TransferRequest::create([
            'user_id' => auth()->id(),
            'amount' => $request->amount,
            'reference' => $request->reference,
            'bank_name' => $request->bank_name,
            'proof_url' => $proofUrl,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Transfer request submitted successfully. Please wait for admin approval.',
            'request' => $transferRequest,
        ], 201);
    }
}

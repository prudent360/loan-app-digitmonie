<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\KycDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KycController extends Controller
{
    public function index(Request $request)
    {
        $documents = $request->user()->kycDocuments()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($documents);
    }

    public function store(Request $request)
    {
        $request->validate([
            'document_type' => 'required|in:id_card,passport,utility_bill,bank_statement',
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        // Check if document type already exists
        $existing = $request->user()->kycDocuments()
            ->where('document_type', $request->document_type)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'A document of this type has already been submitted',
            ], 422);
        }

        $file = $request->file('file');
        $path = $file->store('kyc/' . $request->user()->id, 'public');

        $document = KycDocument::create([
            'user_id' => $request->user()->id,
            'document_type' => $request->document_type,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => $document,
        ], 201);
    }

    public function destroy(Request $request, KycDocument $document)
    {
        if ($document->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($document->status === 'approved') {
            return response()->json([
                'message' => 'Cannot delete approved documents',
            ], 422);
        }

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return response()->json([
            'message' => 'Document deleted successfully',
        ]);
    }
}

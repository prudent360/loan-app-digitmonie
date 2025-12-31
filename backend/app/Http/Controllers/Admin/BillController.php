<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BillTransaction;
use Illuminate\Http\Request;

class BillController extends Controller
{
    public function index(Request $request)
    {
        $query = BillTransaction::with('user:id,name,email');

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_id', 'like', "%{$search}%")
                  ->orWhere('biller_name', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'transactions' => $transactions,
        ]);
    }

    public function show(BillTransaction $bill)
    {
        $bill->load('user:id,name,email');
        
        return response()->json([
            'success' => true,
            'transaction' => $bill,
        ]);
    }

    public function stats()
    {
        return response()->json([
            'success' => true,
            'stats' => [
                'total' => BillTransaction::count(),
                'successful' => BillTransaction::where('status', 'successful')->count(),
                'pending' => BillTransaction::where('status', 'pending')->count(),
                'failed' => BillTransaction::where('status', 'failed')->count(),
                'total_amount' => BillTransaction::where('status', 'successful')->sum('amount'),
            ],
        ]);
    }
}

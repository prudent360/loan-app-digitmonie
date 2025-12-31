<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'customer');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->withCount('loans')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($users);
    }

    public function show(User $user)
    {
        // Load related data
        $user->load([
            'loans' => fn($q) => $q->latest()->take(5),
            'kycDocuments',
            'wallet.transactions' => fn($q) => $q->latest()->take(5),
        ]);

        // Add computed fields
        $user->active_loans_count = $user->loans()->whereIn('status', ['approved', 'disbursed'])->count();
        $user->total_borrowed = $user->loans()->where('status', 'disbursed')->sum('amount');
        $user->wallet_transactions = $user->wallet?->transactions ?? collect();
        
        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }

    public function updateStatus(Request $request, User $user)
    {
        $request->validate([
            'status' => 'required|in:active,suspended,pending',
        ]);

        $user->update(['status' => $request->status]);

        return response()->json([
            'message' => 'User status updated',
            'user' => $user,
        ]);
    }
}

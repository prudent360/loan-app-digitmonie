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
            'userSavings.savingsPlan',
            'userSavings.duration',
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

    public function impersonate(User $user)
    {
        // Generate a temporary token for the user
        $token = $user->createToken('impersonation_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
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

    /**
     * Update user details
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,suspended,pending',
        ]);

        $user->update($request->only(['name', 'email', 'phone', 'status']));

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy(User $user)
    {
        // Prevent deleting admin users
        if ($user->role !== 'customer') {
            return response()->json([
                'message' => 'Cannot delete admin or staff users'
            ], 403);
        }

        // Delete related data
        $user->loans()->delete();
        $user->kycDocuments()->delete();
        $user->wallet?->transactions()->delete();
        $user->wallet?->delete();
        $user->userSavings()->delete();
        $user->tokens()->delete();
        
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}

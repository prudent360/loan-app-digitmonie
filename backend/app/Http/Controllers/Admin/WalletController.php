<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function index(Request $request)
    {
        $query = Wallet::with('user:id,name,email');

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $wallets = $query->orderBy('balance', 'desc')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'wallets' => $wallets,
        ]);
    }

    public function show(Wallet $wallet)
    {
        $wallet->load(['user:id,name,email', 'transactions' => fn($q) => $q->latest()->take(20)]);
        
        return response()->json([
            'success' => true,
            'wallet' => $wallet,
        ]);
    }

    public function stats()
    {
        return response()->json([
            'success' => true,
            'stats' => [
                'total_wallets' => Wallet::count(),
                'total_balance' => Wallet::sum('balance'),
                'active_wallets' => Wallet::where('balance', '>', 0)->count(),
                'locked_wallets' => Wallet::where('is_locked', true)->count(),
            ],
        ]);
    }
}

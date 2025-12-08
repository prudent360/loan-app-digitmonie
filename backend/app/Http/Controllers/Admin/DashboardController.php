<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Loan;
use App\Models\KycDocument;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'totalUsers' => User::where('role', 'customer')->count(),
            'activeLoans' => Loan::where('status', 'active')->count(),
            'totalDisbursed' => Loan::whereIn('status', ['disbursed', 'active', 'completed'])->sum('amount'),
            'pendingApplications' => Loan::where('status', 'pending')->count(),
            'pendingKyc' => KycDocument::where('status', 'pending')->count(),
        ]);
    }

    public function chartData()
    {
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthKey = $date->format('M');
            
            $disbursed = Loan::whereIn('status', ['disbursed', 'active', 'completed'])
                ->whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->sum('amount');

            $months->push([
                'month' => $monthKey,
                'disbursed' => round($disbursed, 2),
            ]);
        }

        return response()->json($months);
    }
}

<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $loans = $user->loans;

        // Only count loans that were actually disbursed (active, disbursed, or completed)
        $disbursedLoans = $loans->whereIn('status', ['active', 'disbursed', 'completed']);
        $totalBorrowed = $disbursedLoans->sum('amount');
        $totalPaid = $loans->sum(fn($loan) => $loan->total_paid);
        $activeLoans = $loans->where('status', 'active')->count();
        $completedLoans = $loans->where('status', 'completed')->count();

        $outstandingBalance = $loans
            ->whereIn('status', ['active', 'disbursed'])
            ->sum(fn($loan) => $loan->remaining_balance);

        $nextPayment = null;
        $nextPaymentDate = null;
        
        $activeLoan = $loans->where('status', 'active')->first();
        if ($activeLoan) {
            $nextRepayment = $activeLoan->next_repayment;
            if ($nextRepayment) {
                $nextPayment = $nextRepayment->amount;
                $nextPaymentDate = $nextRepayment->due_date->format('Y-m-d');
            }
        }

        // Simple credit score based on payment history
        $creditScore = $this->calculateCreditScore($user);

        return response()->json([
            'totalBorrowed' => round($totalBorrowed, 2),
            'totalPaid' => round($totalPaid, 2),
            'outstandingBalance' => round($outstandingBalance, 2),
            'nextPayment' => $nextPayment ? round($nextPayment, 2) : 0,
            'nextPaymentDate' => $nextPaymentDate,
            'creditScore' => $creditScore,
            'activeLoans' => $activeLoans,
            'completedLoans' => $completedLoans,
        ]);
    }

    public function chartData(Request $request)
    {
        $user = $request->user();
        $loans = $user->loans()->with('repayments')->get();

        // Get last 6 months data
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthKey = $date->format('M');
            
            $borrowed = $loans
                ->filter(fn($l) => $l->created_at->format('Y-m') <= $date->format('Y-m'))
                ->sum('amount');
            
            $paid = $loans
                ->flatMap(fn($l) => $l->repayments)
                ->filter(fn($r) => $r->status === 'paid' && $r->paid_at->format('Y-m') <= $date->format('Y-m'))
                ->sum('amount');

            $months->push([
                'month' => $monthKey,
                'borrowed' => round($borrowed, 2),
                'paid' => round($paid, 2),
            ]);
        }

        return response()->json($months);
    }

    private function calculateCreditScore($user)
    {
        $baseScore = 550;
        $loans = $user->loans;

        if ($loans->count() === 0) {
            return $baseScore;
        }

        // Completed loans add points
        $completedLoans = $loans->where('status', 'completed')->count();
        $baseScore += $completedLoans * 30;

        // On-time payments add points
        $onTimePayments = $loans
            ->flatMap(fn($l) => $l->repayments)
            ->filter(fn($r) => $r->status === 'paid' && $r->paid_at <= $r->due_date)
            ->count();
        $baseScore += $onTimePayments * 5;

        // Late payments subtract points
        $latePayments = $loans
            ->flatMap(fn($l) => $l->repayments)
            ->filter(fn($r) => $r->status === 'paid' && $r->paid_at > $r->due_date)
            ->count();
        $baseScore -= $latePayments * 15;

        // Overdue payments subtract more
        $overduePayments = $loans
            ->flatMap(fn($l) => $l->repayments)
            ->filter(fn($r) => $r->status === 'overdue')
            ->count();
        $baseScore -= $overduePayments * 30;

        return max(300, min(850, $baseScore));
    }
}

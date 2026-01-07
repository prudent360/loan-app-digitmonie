<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\SavingsPlan;
use App\Models\UserSaving;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Services\SavingsNotificationService;

class SavingsController extends Controller
{
    public function plans()
    {
        $plans = SavingsPlan::active()
            ->orderBy('interest_rate', 'desc')
            ->get();

        return response()->json(['plans' => $plans]);
    }

    public function index()
    {
        $savings = auth()->user()->userSavings()
            ->with('savingsPlan')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($saving) {
                $saving->calculated_interest = $saving->calculateInterest();
                $saving->total_balance = $saving->amount + $saving->calculated_interest;
                $saving->can_withdraw = $saving->canWithdraw();
                $saving->withdrawal_penalty = $saving->getWithdrawalPenalty();
                return $saving;
            });

        return response()->json(['savings' => $savings]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'savings_plan_id' => 'required|exists:savings_plans,id',
            'amount' => 'required|numeric|min:1'
        ]);

        $plan = SavingsPlan::active()->findOrFail($request->savings_plan_id);

        // Validate amount against plan limits
        if ($request->amount < $plan->min_amount) {
            return response()->json([
                'message' => "Minimum deposit is ₦" . number_format((float)$plan->min_amount)
            ], 400);
        }

        if ($plan->max_amount && $request->amount > $plan->max_amount) {
            return response()->json([
                'message' => "Maximum deposit is ₦" . number_format((float)$plan->max_amount)
            ], 400);
        }

        // Check wallet balance
        $wallet = auth()->user()->wallet;
        if (!$wallet || $wallet->balance < $request->amount) {
            return response()->json(['message' => 'Insufficient wallet balance'], 400);
        }

        // Deduct from wallet
        $wallet->balance -= $request->amount;
        $wallet->save();

        // Calculate maturity date
        $maturityDate = $plan->lock_period_days > 0 
            ? Carbon::now()->addDays($plan->lock_period_days) 
            : null;

        // Create user saving
        $saving = UserSaving::create([
            'user_id' => auth()->id(),
            'savings_plan_id' => $plan->id,
            'amount' => $request->amount,
            'accrued_interest' => 0,
            'maturity_date' => $maturityDate,
            'status' => 'active'
        ]);

        // Log transaction
        $wallet->transactions()->create([
            'type' => 'savings_deposit',
            'amount' => $request->amount,
            'balance_after' => $wallet->balance,
            'description' => "Deposit to {$plan->name}",
            'status' => 'completed'
        ]);

        $saving->load('savingsPlan');

        // Send email notification
        SavingsNotificationService::sendNewSavingsEmail($saving);

        return response()->json([
            'message' => 'Savings created successfully',
            'saving' => $saving
        ], 201);
    }

    public function show($id)
    {
        $saving = auth()->user()->userSavings()
            ->with('savingsPlan')
            ->findOrFail($id);

        $saving->calculated_interest = $saving->calculateInterest();
        $saving->total_balance = $saving->amount + $saving->calculated_interest;
        $saving->can_withdraw = $saving->canWithdraw();
        $saving->withdrawal_penalty = $saving->getWithdrawalPenalty();

        return response()->json(['saving' => $saving]);
    }

    public function withdraw($id)
    {
        $saving = auth()->user()->userSavings()
            ->with('savingsPlan')
            ->where('status', 'active')
            ->findOrFail($id);

        $interest = $saving->calculateInterest();
        $totalAmount = $saving->amount + $interest;
        $penalty = 0;

        // Apply penalty if early withdrawal
        if (!$saving->canWithdraw()) {
            $penalty = $saving->getWithdrawalPenalty();
            $totalAmount -= $penalty;
        }

        // Credit wallet
        $wallet = auth()->user()->wallet;
        $wallet->balance += $totalAmount;
        $wallet->save();

        // Update saving
        $saving->update([
            'status' => 'withdrawn',
            'accrued_interest' => $interest
        ]);

        // Log transaction
        $wallet->transactions()->create([
            'type' => 'savings_withdrawal',
            'amount' => $totalAmount,
            'balance_after' => $wallet->balance,
            'description' => "Withdrawal from {$saving->savingsPlan->name}" . ($penalty > 0 ? " (Penalty: ₦" . number_format($penalty) . ")" : ""),
            'status' => 'completed'
        ]);

        // Send email notification
        SavingsNotificationService::sendWithdrawalEmail($saving, $totalAmount, $penalty);

        return response()->json([
            'message' => 'Withdrawal successful',
            'amount' => $totalAmount,
            'penalty' => $penalty,
            'interest' => $interest
        ]);
    }

    public function addFunds(Request $request, $id)
    {
        $saving = auth()->user()->userSavings()
            ->with('savingsPlan')
            ->where('status', 'active')
            ->findOrFail($id);

        // Only allow adding funds to flexible plans
        if (!$saving->savingsPlan->isFlexible()) {
            return response()->json([
                'message' => 'Cannot add funds to locked savings'
            ], 400);
        }

        $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        // Check wallet
        $wallet = auth()->user()->wallet;
        if (!$wallet || $wallet->balance < $request->amount) {
            return response()->json(['message' => 'Insufficient wallet balance'], 400);
        }

        // Deduct from wallet
        $wallet->balance -= $request->amount;
        $wallet->save();

        // Add to savings
        $saving->amount += $request->amount;
        $saving->save();

        // Log transaction
        $wallet->transactions()->create([
            'type' => 'savings_deposit',
            'amount' => $request->amount,
            'balance_after' => $wallet->balance,
            'description' => "Additional deposit to {$saving->savingsPlan->name}",
            'status' => 'completed'
        ]);

        return response()->json([
            'message' => 'Funds added successfully',
            'saving' => $saving
        ]);
    }
}
